/**
 * Centralized URLs for all Grudge Studio cross-app links.
 * Update these when custom domains are mapped.
 */

// Grudge Builder — canonical app for character creation, islands, home, roster
export const BUILDER_URL = 'https://grudge-builder.vercel.app';

// Crafting Suite
export const CRAFTING_SUITE_URL = 'https://warlord-crafting-suite.vercel.app';

// Object Store
export const OBJECT_STORE_URL = 'https://molochdagod.github.io/ObjectStore/';

/**
 * Open a Grudge Builder page, optionally forwarding the current session token
 * so the user stays logged in across apps.
 */
export function openBuilder(path = '/', { newTab = false } = {}) {
  const url = new URL(path, BUILDER_URL);

  // Forward session token for cross-domain SSO
  const token = localStorage.getItem('grudge_session_token');
  if (token) {
    url.searchParams.set('sso_token', token);
  }

  if (newTab) {
    window.open(url.toString(), '_blank', 'noopener');
  } else {
    window.location.href = url.toString();
  }
}
