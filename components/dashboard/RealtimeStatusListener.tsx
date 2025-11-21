'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

interface RealtimeStatusListenerProps {
  resumeId: string
  userId: string
}

export function RealtimeStatusListener({ resumeId, userId }: RealtimeStatusListenerProps) {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    console.log('Setting up Realtime subscription for resume:', resumeId)

    const channel = supabase
      .channel(`resume-status-${resumeId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'resumes',
          filter: `id=eq.${resumeId}`,
        },
        (payload) => {
          console.log('Realtime update received:', payload)
          const newStatus = payload.new?.status

          if (newStatus === 'completed' || newStatus === 'failed') {
            console.log('Resume status changed to:', newStatus, '- refreshing page')
            router.refresh()
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status)
      })

    // Cleanup on unmount
    return () => {
      console.log('Cleaning up Realtime subscription')
      channel.unsubscribe()
      supabase.removeChannel(channel)
    }
  }, [resumeId, userId, router, supabase])

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 mb-4">
      <div className="flex items-start gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-blue-600 shrink-0" />
        <div className="flex-1">
          <h3 className="font-semibold text-blue-900">Processing Your Resume</h3>
          <p className="mt-1 text-sm text-blue-700">
            Our AI is analyzing your resume. This usually takes 30-40 seconds.
          </p>
          <p className="mt-2 text-xs text-blue-600">
            This page will automatically refresh when processing completes.
          </p>
        </div>
      </div>
    </div>
  )
}
