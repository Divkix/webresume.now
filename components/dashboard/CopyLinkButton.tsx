"use client";

import { Check, Link2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { copyToClipboard } from "@/lib/utils/clipboard";

interface CopyLinkButtonProps {
  handle: string;
}

export function CopyLinkButton({ handle }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const url = `${window.location.origin}/@${handle}`;

    const success = await copyToClipboard(url);

    if (success) {
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error("Failed to copy link. Please copy manually.");
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-300",
        copied
          ? "bg-linear-to-r from-emerald-600 to-emerald-700 text-white shadow-depth-sm"
          : "bg-linear-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white shadow-depth-sm hover:shadow-depth-md focus:ring-2 focus:ring-red-500 focus:ring-offset-2",
      )}
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
    </button>
  );
}
