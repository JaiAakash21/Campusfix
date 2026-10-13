let _csrfToken = null;

export async function initCsrf() {
    try {
        const res = await fetch('/backend/api/auth/csrf.php', { credentials: 'include' });
        if (!res.ok) return null;
        const data = await res.json();
        _csrfToken = data?.csrf_token || null;
        return _csrfToken;
    } catch (err) {
        console.warn('CSRF token fetch failed:', err);
        return null;
    }
}

export function setCsrfToken(token) {
    _csrfToken = token;
}

async function request(method, path, body) {
    const isMutation = ['POST', 'PATCH', 'DELETE'].includes(method.toUpperCase());
    if (!_csrfToken && !path.includes('/auth/csrf.php') && isMutation) {
        await initCsrf();
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
