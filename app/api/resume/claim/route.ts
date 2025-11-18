import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CopyObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { r2Client, R2_BUCKET } from '@/lib/r2'
import { parseResume } from '@/lib/replicate'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // 1. Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { key } = await request.json()

    if (!key || !key.startsWith('temp/')) {
      return NextResponse.json({ error: 'Invalid key' }, { status: 400 })
    }

    // 2. Rate limiting check (5 uploads per 24 hours)
    const { count, error: countError } = await supabase
      .from('resumes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte(
        'created_at',
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      )

    if (countError) throw countError

    if (count && count >= 5) {
      return NextResponse.json(
        { error: 'Upload limit reached. Maximum 5 uploads per 24 hours.' },
        { status: 429 }
      )
    }

    // 3. Copy object to user's folder
    const timestamp = Date.now()
    const filename = key.split('/').pop()
    const newKey = `users/${user.id}/${timestamp}/${filename}`

    await r2Client.send(
      new CopyObjectCommand({
        Bucket: R2_BUCKET,
        CopySource: `${R2_BUCKET}/${key}`,
        Key: newKey,
      })
    )

    // 4. Delete temp object
    await r2Client.send(
      new DeleteObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
      })
    )

    // 5. Insert into database with pending_claim status first
    const { data: resume, error: insertError } = await supabase
      .from('resumes')
      .insert({
        user_id: user.id,
        r2_key: newKey,
        status: 'pending_claim',
      })
      .select()
      .single()

    if (insertError) throw insertError

    // 6. Generate presigned URL for Replicate (7 day expiry)
    const getCommand = new GetObjectCommand({
      Bucket: R2_BUCKET,
      Key: newKey,
    })

    const presignedUrl = await getSignedUrl(r2Client, getCommand, {
      expiresIn: 7 * 24 * 60 * 60, // 7 days
    })

    // 7. Trigger Replicate parsing
    let replicateJobId: string | null = null
    let parseError: string | null = null

    try {
      const prediction = await parseResume(presignedUrl)
      replicateJobId = prediction.id
    } catch (error) {
      console.error('Failed to trigger Replicate parsing:', error)
      parseError = error instanceof Error ? error.message : 'Failed to start AI parsing'
    }

    // 8. Update resume with replicate job ID or error
    const updatePayload: {
      status: 'processing' | 'failed'
      replicate_job_id?: string
      error_message?: string
    } = replicateJobId
      ? {
          status: 'processing',
          replicate_job_id: replicateJobId,
        }
      : {
          status: 'failed',
          error_message: parseError || 'Unknown error',
        }

    const { error: updateError } = await supabase
      .from('resumes')
      .update(updatePayload)
      .eq('id', resume.id)

    if (updateError) {
      console.error('Failed to update resume with replicate job:', updateError)
      // Continue anyway - status endpoint will handle it
    }

    return NextResponse.json({
      resume_id: resume.id,
      status: updatePayload.status,
    })
  } catch (error) {
    console.error('Error claiming resume:', error)
    return NextResponse.json(
      { error: 'Failed to claim resume' },
      { status: 500 }
    )
  }
}
