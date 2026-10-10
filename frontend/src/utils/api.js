// Single HTTP client for CampusFix.
// Call initCsrf() once on app load before any state-changing requests.
// All other code should use apiGet / apiPost / apiPatch / apiDelete.

let _csrfToken = null;

// Phase 1 of CSRF bootstrap — fetch a token before login/register
export async function initCsrf() {
    const res = await fetch('/backend/api/auth/csrf.php', { credentials: 'include' });
    if (!res.ok) throw new Error('Could not start session');
    const { csrf_token } = await res.json();
    _csrfToken = csrf_token;
}

// Phase 2 — called after a successful login with the fresh token from me.php
export function setCsrfToken(token) {
    _csrfToken = token;
}

async function request(method, path, body) {
    const isFormData = body instanceof FormData;

    const headers = {
        ...(_csrfToken ? { 'X-CSRF-Token': _csrfToken } : {}),
        ...(body !== undefined && !isFormData ? { 'Content-Type': 'application/json' } : {}),
    };

    const res = await fetch(path, {
        method,
        credentials: 'include',
        headers,
        ...(body !== undefined ? { body: isFormData ? body : JSON.stringify(body) } : {}),
    });

    // Session expired or cookie invalid — redirect to login
    if (res.status === 401) {
        _csrfToken = null;
        window.location.href = '/login';
        return undefined;
    }

    return res;
}

export const apiGet    = (path)       => request('GET',    path, undefined);
export const apiPost   = (path, body) => request('POST',   path, body);
export const apiPatch  = (path, body) => request('PATCH',  path, body);
export const apiDelete = (path)       => request('DELETE', path, undefined);
