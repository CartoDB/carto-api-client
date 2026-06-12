/**
 * How requests to the CARTO APIs are authenticated.
 *
 * - `'token'` (default): every request carries `Authorization: Bearer <accessToken>`.
 * - `'session'`: requests carry NO Authorization header and are sent with
 *   `credentials: 'same-origin'`. Authentication is delegated to the server
 *   behind `apiBaseUrl` — typically a same-origin proxy that attaches the
 *   credential server-side from a session cookie. Used by CARTO hosted apps
 *   (`apiBaseUrl: '/app/_proxy/<slug>'`) and other single-origin deployments
 *   where the access token must never be exposed to JavaScript.
 */
export type AuthMode = 'token' | 'session';

/**
 * Authentication options shared by sources, queries, widget sources and
 * fetchMap:
 *
 * - token mode (default): `accessToken` is required.
 * - session mode: `authMode: 'session'` and no `accessToken`.
 *
 * Validated at request time by {@link buildAuthHeaders}.
 */
export type AuthOptions = {
  /** Carto platform access token. Required unless `authMode` is `'session'`. */
  accessToken?: string;
  /** @default 'token' */
  authMode?: AuthMode;
};

/**
 * Builds the Authorization headers for a request: a Bearer header in token
 * mode, no auth headers at all in session mode (the server-side session
 * middleware must see the header absent to engage). Also validates the
 * options, so every request path fails fast on a misconfiguration.
 */
export function buildAuthHeaders(options: AuthOptions): Record<string, string> {
  if (options.authMode === 'session') {
    if (options.accessToken) {
      throw new Error(
        `accessToken must not be provided with authMode: 'session' — ` +
          `authentication is delegated to the server behind apiBaseUrl`
      );
    }
    return {};
  }
  if (!options.accessToken) {
    throw new Error(
      `accessToken is required (or pass authMode: 'session' to authenticate ` +
        `via a same-origin session instead)`
    );
  }
  return {Authorization: `Bearer ${options.accessToken}`};
}

/**
 * `fetch()` credentials for the given auth mode. Session mode must send the
 * cookie explicitly; token mode preserves today's behavior (unset).
 */
export function getAuthCredentials(
  authMode?: AuthMode
): RequestCredentials | undefined {
  return authMode === 'session' ? 'same-origin' : undefined;
}

/**
 * Rewrites an absolute CARTO API URL (e.g. a tilejson `tiles[]` template or
 * the map-instantiation `dataUrl`, which always point at the tenant API host)
 * onto the configured `apiBaseUrl`. In session mode the browser cannot reach
 * the API host directly — every request must go through the same-origin
 * proxy that `apiBaseUrl` points at. Relative URLs are returned unchanged.
 */
export function rewriteUrlForSessionMode(
  url: string,
  apiBaseUrl: string
): string {
  let origin: string;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return url;
    }
    origin = parsed.origin;
  } catch {
    // Relative URL — already same-origin, nothing to rewrite.
    return url;
  }
  // Keep the path+query as a raw slice rather than re-serializing through
  // URL: tile URL templates contain literal placeholders ({z}/{x}/{y}) that
  // URL#pathname would percent-encode, breaking template substitution.
  const base = apiBaseUrl.replace(/\/+$/, '');
  return base + url.slice(origin.length);
}
