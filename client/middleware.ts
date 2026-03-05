import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse, type NextRequest } from 'next/server';

const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'localhost';

const isPublicRoute = createRouteMatcher([
  '/login(.*)',
  '/select-school(.*)',
  '/schools/(.*)', // public school profile
]);

const isPlatformRoute = createRouteMatcher(['/platform(.*)']);

function extractSlug(req: NextRequest): string | null {
  const host = req.headers.get('host') ?? '';
  const parts = host.split('.');

  // <slug>.app.com → 3+ parts; <slug>.localhost → 2 parts
  if (
    (parts.length >= 3 && parts.slice(1).join('.') === APP_DOMAIN) ||
    (parts.length === 2 && parts[1] === APP_DOMAIN)
  ) {
    const slug = parts[0];
    if (slug !== 'www' && slug !== 'app' && slug !== 'platform') {
      return slug;
    }
  }

  return null;
}

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }

  const slug = extractSlug(req);
  const requestHeaders = new Headers(req.headers);

  if (slug) {
    requestHeaders.set('x-tenant-slug', slug);
  }

  // Redirect platform subdomain to /platform routes
  if (req.headers.get('host')?.startsWith('platform.')) {
    const url = req.nextUrl.clone();
    if (!url.pathname.startsWith('/platform')) {
      url.pathname = `/platform${url.pathname}`;
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
