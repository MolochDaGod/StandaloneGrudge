/**
 * Crafting Suite SSO Launcher
 * Generates an SSO token via the GrudgeWars backend and opens
 * the Crafting Suite (grudge-crafting.puter.site) with the player
 * already authenticated.
 */

import { API_BASE } from './apiBase.js';

const CRAFTING_SUITE_FALLBACK = 'https://grudge-crafting.puter.site';

/**
 * Open the Crafting Suite in a new tab with SSO authentication.
 * @param {Object} opts
 * @param {string} [opts.characterId] - Optional character ID to pre-select
 * @param {string} [opts.route] - Optional route path on the crafting site (e.g. '/crafting')
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function launchCraftingSuite({ characterId, route } = {}) {
  const sessionToken = localStorage.getItem('grudge_session_token')
    || localStorage.getItem('grudge_studio_session');

  if (!sessionToken) {
    return { success: false, error: 'Not logged in — please sign in first.' };
  }

  try {
    const res = await fetch(`${API_BASE}/api/crafting/sso-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Token': sessionToken,
      },
      body: JSON.stringify({ characterId: characterId || undefined }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Request failed' }));
      return { success: false, error: err.error || `SSO token request failed (${res.status})` };
    }

    const data = await res.json();

    if (!data.success || !data.redirectUrl) {
      return { success: false, error: data.error || 'No redirect URL returned' };
    }

    // Append optional route
    let url = data.redirectUrl;
    if (route) {
      const u = new URL(url);
      u.pathname = route;
      url = u.toString();
    }

    window.open(url, '_blank', 'noopener');
    return { success: true };
  } catch (err) {
    console.error('[CraftingSuiteSSO] Launch failed:', err);
    return { success: false, error: err.message || 'Failed to connect to server' };
  }
}

/**
 * Open the Crafting Suite without SSO (unauthenticated fallback).
 */
export function openCraftingSuiteUnauthenticated() {
  window.open(CRAFTING_SUITE_FALLBACK, '_blank', 'noopener');
}
