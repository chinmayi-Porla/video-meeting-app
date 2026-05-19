import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('aura_token')?.value;

  // Define public paths that guests can access
  const isAuthPath = pathname.startsWith('/login') || pathname.startsWith('/signup');
  const isApiPath = pathname.startsWith('/api');
  const isRootPath = pathname === '/';

  // Skip API paths to let them handle validation natively
  if (isApiPath) {
    return NextResponse.next();
  }

  // The root path "/" handles its own auth display logic client-side.
  // Never redirect it — it shows either Landing or Dashboard based on localStorage.
  if (isRootPath) {
    return NextResponse.next();
  }

  // 1. Guest trying to access protected page -> Redirect to /login
  if (!token && !isAuthPath) {
    console.log(`[Middleware] Unauthorized access to ${pathname}, redirecting to /login`);
    const loginUrl = new URL(`/login?redirectTo=${encodeURIComponent(pathname)}`, request.url);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Authenticated user trying to access login/signup -> Redirect to dashboard (/)
  if (token && isAuthPath) {
    console.log(`[Middleware] Authenticated user on ${pathname}, redirecting to /`);
    const homeUrl = new URL('/', request.url);
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

// Configure paths that should trigger this middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
