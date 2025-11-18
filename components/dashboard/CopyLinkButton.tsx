'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Link2, Check } from 'lucide-react'
import { toast } from 'sonner'

interface CopyLinkButtonProps {
  handle: string
}

export function CopyLinkButton({ handle }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    const url = `${window.location.origin}/${handle}`

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        toast.success('Link copied to clipboard!')
        setTimeout(() => setCopied(false), 2000)
      } else {
        // Fallback for browsers without Clipboard API
        const textArea = document.createElement('textarea')
        textArea.value = url
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()

        try {
          document.execCommand('copy')
          setCopied(true)
          toast.success('Link copied to clipboard!')
          setTimeout(() => setCopied(false), 2000)
        } catch {
          toast.error('Failed to copy link. Please copy manually.')
        }

        document.body.removeChild(textArea)
      }
    } catch {
      toast.error('Failed to copy link')
    }
  }

  return (
    <Button
      onClick={copyToClipboard}
      variant="outline"
      className="flex items-center gap-2"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4" />
          Copied!
        </>
      ) : (
        <>
          <Link2 className="h-4 w-4" />
          Copy Share Link
        </>
      )}
    </Button>
  )
}
