'use client'

import { useState, useRef, DragEvent, ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { validatePDF } from '@/lib/utils/validation'

interface FileDropzoneProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FileDropzone({ open, onOpenChange }: FileDropzoneProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadComplete, setUploadComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      processFile(droppedFile)
    }
  }

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      processFile(selectedFile)
    }
  }

  const processFile = (selectedFile: File) => {
    setError(null)

    const validation = validatePDF(selectedFile)
    if (!validation.valid) {
      setError(validation.error!)
      toast.error(validation.error!)
      return
    }

    setFile(selectedFile)
    uploadFile(selectedFile)
  }

  const uploadFile = async (fileToUpload: File) => {
    setUploading(true)
    setUploadProgress(0)
    setError(null)

    try {
      // Step 1: Get presigned URL
      const signResponse = await fetch('/api/upload/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: fileToUpload.name }),
      })

      if (!signResponse.ok) {
        const data = await signResponse.json()
        throw new Error(data.error || 'Failed to get upload URL')
      }

      const { uploadUrl, key } = await signResponse.json()

      // Step 2: Upload to R2
      setUploadProgress(25)

      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/pdf',
        },
        body: fileToUpload,
      })

      setUploadProgress(75)

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file')
      }

      setUploadProgress(100)

      // Step 3: Save key to localStorage
      localStorage.setItem('temp_upload_key', key)

      setUploadComplete(true)
      toast.success('File uploaded successfully!')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload file'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setUploading(false)
    }
  }

  const handleLoginRedirect = () => {
    onOpenChange(false)
    // The login button in the header will handle the actual auth flow
    toast.info('Please log in to save your resume')
  }

  const handleClose = () => {
    if (!uploading) {
      setFile(null)
      setUploadComplete(false)
      setError(null)
      setUploadProgress(0)
      onOpenChange(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Your Resume</DialogTitle>
          </DialogHeader>

          {!uploadComplete ? (
            <div className="space-y-4">
              {/* Drop Zone */}
              <div
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
                  ${isDragging
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-gray-300 hover:border-amber-400 hover:bg-gray-50'
                  }
                  ${uploading ? 'pointer-events-none opacity-60' : ''}
                `}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={uploading}
                />

                <div className="flex flex-col items-center gap-3">
                  <svg
                    className="w-12 h-12 text-amber-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>

                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      {file ? file.name : 'Drop your PDF here'}
                    </p>
                    <p className="text-xs text-gray-500">
                      or click to browse • Max 10MB
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              {uploading && (
                <div className="space-y-2">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-xs text-center text-gray-500">
                    Uploading... {uploadProgress}%
                  </p>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* Info Text */}
              {!uploading && !error && (
                <p className="text-xs text-gray-500 text-center">
                  Your file is uploaded anonymously. Log in to save and publish.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {/* Success State */}
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>

                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Upload Complete!
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {file?.name} has been uploaded successfully.
                  </p>
                </div>

                <Button
                  onClick={handleLoginRedirect}
                  className="w-full bg-amber-600 hover:bg-amber-700"
                >
                  Log In to Save
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  Your upload will be automatically claimed after login
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
