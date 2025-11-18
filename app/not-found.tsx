import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FFFAF5] flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="mb-8">
          <div className="text-8xl font-bold text-amber-600 mb-4">404</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Page Not Found
          </h1>
          <p className="text-gray-600 text-lg">
            The page you&apos;re looking for doesn&apos;t exist.
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 transition-colors"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    </div>
  )
}
