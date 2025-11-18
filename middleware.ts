import { type NextRequest } from 'next/server'
import { updateSession } from './lib/supabase/middleware'
import { NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request)

  // Protected routes that require authentication
  const protectedRoutes = [
    '/dashboard',
    '/onboarding',
    '/edit',
    '/settings',
    '/waiting'
  ]

  // Check if current path starts with any protected route
  const isProtectedRoute = protectedRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  )

  // Redirect to home if accessing protected route without auth
  if (isProtectedRoute && !user) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
