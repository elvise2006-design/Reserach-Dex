// Thin fetch wrapper: bearer auth, one automatic refresh on 401, uniform error type.
const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "";
const K = { access: "rdx_access", refresh: "rdx_refresh" };

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public details?: unknown) {
    super(message);
  }
}

export const tokens = {
  get access() { return localStorage.getItem(K.access); },
  get refresh() { return localStorage.getItem(K.refresh); },
  set(a: string, r: string) { localStorage.setItem(K.access, a); localStorage.setItem(K.refresh, r); },
  clear() { localStorage.removeItem(K.access); localStorage.removeItem(K.refresh); },
};

let refreshing: Promise<boolean> | null = null;
async function refreshTokens(): Promise<boolean> {
  const r = tokens.refresh;
  if (!r) return false;
  refreshing ??= fetch(`${BASE}/api/auth/refresh`, {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ refresh_token: r }),
  }).then(async (res) => {
    if (!res.ok) { tokens.clear(); return false; }
    const t = await res.json();
    tokens.set(t.access_token, t.refresh_token);
    return true;
  }).catch(() => false).finally(() => { refreshing = null; });
  return refreshing;
}

async function toError(res: Response): Promise<ApiError> {
  let body: any = null;
  try { body = await res.json(); } catch { /* not json */ }
  const e = body?.error;
  return new ApiError(res.status, e?.code ?? "error", e?.message ?? `Request failed (${res.status})`, e?.details);
}

export async function raw(path: string, init: RequestInit = {}, retry = true): Promise<Response> {
  const headers = new Headers(init.headers);
  if (tokens.access) headers.set("Authorization", `Bearer ${tokens.access}`);
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, { ...init, headers });
  } catch {
    throw new ApiError(0, "network", "Cannot reach the server. Is the backend running?");
  }
  if (res.status === 401 && retry && tokens.refresh && (await refreshTokens())) return raw(path, init, false);
  if (!res.ok) throw await toError(res);
  return res;
}

export async function json<T>(path: string, init: Omit<RequestInit, "body"> & { body?: any } = {}): Promise<T> {
  const headers = new Headers(init.headers);
  let body = init.body;
  if (body && !(body instanceof FormData)) { headers.set("content-type", "application/json"); body = JSON.stringify(body); }
  const res = await raw(path, { ...init, headers, body });
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

export async function publicJson<T>(path: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  } catch {
    throw new ApiError(0, "network", "Cannot reach the server. Is the backend running?");
  }
  if (!res.ok) throw await toError(res);
  return res.json();
}

export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
