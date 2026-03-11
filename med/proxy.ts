import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Paths that do not require any auth check
  if (
    path.startsWith('/_next') ||
    path.startsWith('/api') ||
    path.startsWith('/public') ||
    path === '/register'
  ) {
    return NextResponse.next();
  }

  // Get session from cookie
  const sessionCookie = request.cookies.get('session')?.value;
  let session = null;

  if (sessionCookie) {
    try {
      session = JSON.parse(sessionCookie);
    } catch (e) {
      session = null;
    }
  }

  // Define role-to-dashboard mapping
  const roleToRoute: Record<string, string> = {
    chef_service: '/admin',
    medecin: '/medecin',
    secretaire: '/secretaire',
  };

  // If we are at the login page
  if (path === '/') {
    // If user is already logged in, redirect them to their dashboard
    if (session && session.role && roleToRoute[session.role]) {
      return NextResponse.redirect(new URL(roleToRoute[session.role], request.url));
    }
    // Otherwise allow them to view the login page
    return NextResponse.next();
  }

  // If user is NOT logged in and tries to access a protected route
  if (!session || !session.role) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const role = session.role;
  const userDash = roleToRoute[role] || '/';

  // Check role-based access
  if (path.startsWith('/admin') && role !== 'chef_service') {
    return NextResponse.redirect(new URL(userDash, request.url));
  }
  
  if (path.startsWith('/medecin') && role !== 'medecin') {
    return NextResponse.redirect(new URL(userDash, request.url));
  }
  
  if (path.startsWith('/secretaire') && role !== 'secretaire') {
    return NextResponse.redirect(new URL(userDash, request.url));
  }

  // Otherwise, user has correct role, allow them through
  return NextResponse.next();
}

// Enable middleware for all routes except static assets
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public SVGs
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.svg).*)',
  ],
};
