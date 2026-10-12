let _csrfToken = null;

export async function initCsrf() {
    const res = await fetch('/backend/api/auth/csrf.php', { credentials: 'include' });
    if (!res.ok) throw new Error('Could not start session');
    const { csrf_token } = await res.json();
    _csrfToken = csrf_token;
}

export function setCsrfToken(token) {
    _csrfToken = token;
}

async function request(method, path, body) {
    if (!_csrfToken && !path.includes('/auth/csrf.php')) {
        try {
            await initCsrf();
        } catch {
            // Non-fatal if server is unreachable
        }
    }

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
        if (!path.includes('/auth/me.php') && !path.includes('/auth/login.php') && window.location.pathname !== '/login') {
            _csrfToken = null;
            window.location.href = '/login';
            return undefined;
        }
    }

    return res;
}

export const apiGet    = (path)       => request('GET',    path, undefined);
export const apiPost   = (path, body) => request('POST',   path, body);
export const apiPatch  = (path, body) => request('PATCH',  path, body);
export const apiDelete = (path)       => request('DELETE', path, undefined);
