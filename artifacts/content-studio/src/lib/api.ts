const getBaseUrl = () => {
  const base = import.meta.env.BASE_URL ?? "/";
  return base.replace(/\/$/, "") + "/api";
};

const getToken = () => localStorage.getItem("token") ?? "";

function authHeaders(): Record<string, string> {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function requestJson(method: string, path: string, body?: any) {
  const url = getBaseUrl() + path;
  const res = await fetch(url, {
    method,
    headers: authHeaders(),
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err: any = new Error(data?.error ?? "Request failed");
    err.response = { status: res.status, data };
    throw err;
  }
  return { data, status: res.status };
}

function fetchRaw(path: string, init?: RequestInit): Promise<Response> {
  const url = getBaseUrl() + path;
  return fetch(url, {
    ...init,
    headers: {
      ...authHeaders(),
      ...(init?.headers ?? {}),
    },
  });
}

type ApiFn = {
  (path: string, init?: RequestInit): Promise<Response>;
  get: (path: string) => Promise<{ data: any; status: number }>;
  post: (path: string, body: any) => Promise<{ data: any; status: number }>;
  patch: (path: string, body: any) => Promise<{ data: any; status: number }>;
  put: (path: string, body: any) => Promise<{ data: any; status: number }>;
  delete: (path: string) => Promise<{ data: any; status: number }>;
};

const fn = fetchRaw as unknown as ApiFn;
fn.get    = (path) => requestJson("GET", path);
fn.post   = (path, body) => requestJson("POST", path, body);
fn.patch  = (path, body) => requestJson("PATCH", path, body);
fn.put    = (path, body) => requestJson("PUT", path, body);
fn.delete = (path) => requestJson("DELETE", path);

export const apiClient = fn;
export const api = fn;
