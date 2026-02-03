"use client";

import { Upload } from "lucide-react";
import { useState } from "react";
import { FileDropzone } from "@/components/FileDropzone";
import { Button } from "@/components/ui/button";

export function DashboardUploadSection() {
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setUploadModalOpen(true)}
        variant="outline"
        className="flex-1 border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400 font-semibold transition-all duration-300 shadow-depth-sm hover:shadow-depth-md"
      >
        <Upload className="h-4 w-4 mr-2" />
        Upload New Resume
      </Button>

      <FileDropzone open={uploadModalOpen} onOpenChange={setUploadModalOpen} />
    </>
  );
}
