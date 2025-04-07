import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname

  // Define public paths that don't require authentication
  const isPublicPath = path === "/login" || path === "/register" || path === "/" || path === "/explore"

  // Check if user is authenticated by looking for the session token
  const token =
    request.cookies.get("next-auth.session-token")?.value ||
    request.cookies.get("__Secure-next-auth.session-token")?.value

  // Redirect logic
  if (isPublicPath && token) {
    // If user is on a public path but is authenticated, redirect to trips page
    return NextResponse.redirect(new URL("/trips", request.url))
  }

  if (!isPublicPath && !token) {
    // If user is on a protected path but not authenticated, redirect to login
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ["/", "/login", "/register", "/trips/:path*", "/profile", "/wallet", "/explore"],
}

