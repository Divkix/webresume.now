'use client'

import { useState } from 'react'
import { LoginButton } from '@/components/auth/LoginButton'
import { FileDropzone } from '@/components/FileDropzone'
import { Toaster } from '@/components/ui/sonner'

export default function Home() {
  const [uploadModalOpen, setUploadModalOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster />
      <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/80 backdrop-blur-md shadow-depth-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-slate-900">
            webresume<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600">.now</span>
          </div>
          <LoginButton />
        </div>
      </header>

      <main className="flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 pt-20 pb-32">
        {/* Hero Section */}
        <div className="max-w-4xl mx-auto text-center animate-fade-in-up">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 mb-6 leading-[1.1] tracking-tight">
            Your Résumé is
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500">
              already a Website
            </span>
          </h1>

          <p className="text-xl sm:text-2xl text-slate-600 mb-12 max-w-2xl mx-auto leading-relaxed font-light">
            Drop your PDF. Get a shareable link. It takes less than a minute.
          </p>

          {/* Upload Zone */}
          <div className="max-w-2xl mx-auto mb-8">
            <div
              onClick={() => setUploadModalOpen(true)}
              className="group relative bg-white rounded-2xl shadow-depth-md border border-slate-200/60 p-12 cursor-pointer transition-all duration-300 hover:shadow-depth-lg hover:-translate-y-1 backdrop-blur-sm overflow-hidden"
            >
              {/* Subtle gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-transparent to-blue-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

              <div className="relative z-10 flex flex-col items-center gap-4">
                {/* Icon with gradient background */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-300" />
                  <div className="relative bg-gradient-to-r from-indigo-100 to-blue-100 p-4 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                    <svg
                      className="w-12 h-12 text-transparent bg-clip-text"
                      style={{
                        fill: 'url(#uploadGradient)'
                      }}
                      viewBox="0 0 24 24"
                    >
                      <defs>
                        <linearGradient id="uploadGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#4F46E5" />
                          <stop offset="100%" stopColor="#3B82F6" />
                        </linearGradient>
                      </defs>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        stroke="url(#uploadGradient)"
                        fill="none"
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-lg font-semibold text-slate-900 mb-1">
                    Drop your PDF résumé here
                  </p>
                  <p className="text-sm text-slate-500">
                    or click to browse • Max 10MB
                  </p>
                </div>
              </div>
            </div>

            <p className="text-sm text-slate-500 mt-4 text-center">
              Upload anonymously. No account needed until you&apos;re ready to publish.
            </p>
          </div>
        </div>

        {/* Trust Signals */}
        <div className="mt-20 max-w-4xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-amber-600 mb-2">~30s</div>
              <div className="text-gray-600">Average setup time</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-amber-600 mb-2">AI-Powered</div>
              <div className="text-gray-600">Smart parsing & formatting</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-amber-600 mb-2">Free</div>
              <div className="text-gray-600">Always free to create</div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-amber-200 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-600 text-sm">
            Built with Next.js • Powered by Cloudflare • Privacy-first design
          </p>
        </div>
      </footer>

      {/* FileDropzone Modal */}
      <FileDropzone open={uploadModalOpen} onOpenChange={setUploadModalOpen} />
    </div>
  )
}
