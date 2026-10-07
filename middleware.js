// Visitor logging for sarfaraz27.vercel.app
// Runs on every page visit and writes one line to Vercel Logs.
// No extra packages needed: Vercel adds these headers to every request.

export default function middleware(request) {
  const h = request.headers;
  const url = new URL(request.url);

  const visit = {
    time: new Date().toISOString(),
    ip: h.get('x-real-ip') || (h.get('x-forwarded-for') || '').split(',')[0].trim(),
    country: h.get('x-vercel-ip-country'),
    city: decodeURIComponent(h.get('x-vercel-ip-city') || ''),
    path: url.pathname,
    ref: url.searchParams.get('ref'),        // e.g. ?ref=tamm
    referrer: h.get('referer'),
    userAgent: h.get('user-agent'),
  };

  console.log('VISIT ' + JSON.stringify(visit));
  // Returning nothing lets the page load as normal.
}

// Only log real page visits, not images, scripts or other static files.
export const config = {
  matcher: ['/((?!_next|assets|api|favicon|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|map|txt|xml|woff2?)).*)'],
};
