/**
 * CSRF Token Management
 * Requirement 25.1: CSRF Protection
 */

let cachedToken: string | null = null;
let tokenExpiry: number = 0;

/**
 * Get CSRF token from server
 * Caches token for 5 minutes to reduce server requests
 */
export async function getCsrfToken(): Promise<string> {
  // Return cached token if still valid
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  try {
    const response = await fetch('/api/csrf-token', {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to get CSRF token: ${response.status}`);
    }

    const data = await response.json();

    if (!data.ok || !data.csrfToken) {
      throw new Error('Invalid CSRF token response');
    }

    // Cache token for 5 minutes
    cachedToken = data.csrfToken;
    tokenExpiry = Date.now() + 5 * 60 * 1000;

    return cachedToken;
  } catch (error) {
    console.error('Error fetching CSRF token:', error);
    throw error;
  }
}

/**
 * Clear cached CSRF token
 * Call this after logout or when token becomes invalid
 */
export function clearCsrfToken(): void {
  cachedToken = null;
  tokenExpiry = 0;
}

/**
 * Refresh CSRF token by clearing cache and fetching new one
 * Call this when CSRF validation fails
 */
export async function refreshCsrfToken(): Promise<string> {
  clearCsrfToken();
  return getCsrfToken();
}

/**
 * Make authenticated API request with CSRF token
 */
export async function fetchWithCsrf(url: string, options: RequestInit = {}): Promise<Response> {
  const csrfToken = await getCsrfToken();

  const headers = new Headers(options.headers);
  headers.set('X-CSRF-Token', csrfToken);
  headers.set('Content-Type', 'application/json');
  // ensureLegacyAuthHeader 제거 - 정의되지 않은 함수였음

  return fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });
}
