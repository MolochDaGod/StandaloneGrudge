/**
 * API Base URL Resolver
 * When the client runs on the canonical domain (grudgewarlords.com, Vercel previews,
 * or localhost), API calls use same-origin (empty prefix).
 * When hosted elsewhere (e.g. grudgeplatform.puter.site), calls are routed to
 * the canonical Vercel backend.
 */

const CANONICAL_API = 'https://grudgewarlords.com';

function resolveApiBase() {
  if (typeof window === 'undefined') return '';
  const host = window.location.hostname;
  // Same-origin: localhost, Vercel previews, canonical domain
  if (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === 'grudgewarlords.com' ||
    host === 'www.grudgewarlords.com' ||
    host.endsWith('.vercel.app')
  ) {
    return '';
  }
  // External host (puter.site, etc.) — route to canonical API
  return CANONICAL_API;
}

export const API_BASE = resolveApiBase();
