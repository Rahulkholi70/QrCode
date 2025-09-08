import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the request is for /dashboard routes
  if (pathname.startsWith('/dashboard')) {
    // Check for JWT token in cookies
    const token = request.cookies.get('token')?.value;

    if (!token) {
      // Redirect to /admin/login if no token
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Allow the request to continue
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
