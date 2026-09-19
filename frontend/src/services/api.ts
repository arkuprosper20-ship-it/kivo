const BASE = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000/api';

export class ApiError extends Error {
  code: number;
  constructor(message: string, code = 500) { super(message); this.code = code; }
}

function token(): string | null {
  try { return localStorage.getItem('kivo_token'); } catch { return null; }
}

async function request<T>(path: string, opts?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...opts,
      headers: {
        'Content-Type': 'application/json',
        ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
        ...(opts?.headers || {}),
      },
    });
  } catch {
    throw new ApiError('Cannot reach the KIVO server. Start the backend, then retry.', 0);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data as any)?.error?.message || `Request failed (${res.status})`;
    throw new ApiError(msg, res.status);
  }
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
};

export const API_BASE = BASE;
