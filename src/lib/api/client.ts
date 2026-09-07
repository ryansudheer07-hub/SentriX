/**
 * Thin fetch wrapper for the SentriX backend. All calls go to `/api/*`, which
 * Next rewrites to the FastAPI service (see `next.config.ts`).
 */

const TOKEN_KEY = "sentrix.token"
export const UNAUTHORIZED_EVENT = "sentrix:unauthorized"

let memoryToken: string | null = null

export function getToken(): string | null {
  if (memoryToken) return memoryToken
  try {
    memoryToken = window.localStorage.getItem(TOKEN_KEY)
  } catch {
    memoryToken = null
  }
  return memoryToken
}

export function setToken(token: string): void {
  memoryToken = token
  try {
    window.localStorage.setItem(TOKEN_KEY, token)
  } catch {
    /* private mode: session-only token still works via memoryToken */
  }
}

export function clearToken(): void {
  memoryToken = null
  try {
    window.localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* ignore */
  }
}

export class ApiError extends Error {
  readonly status: number
  readonly detail: string
  constructor(status: number, detail: string) {
    super(detail)
    this.name = "ApiError"
    this.status = status
    this.detail = detail
  }
}

interface RequestOptions {
  method?: "GET" | "POST"
  /** JSON body. */
  body?: unknown
  /** `application/x-www-form-urlencoded` body (used by `/auth/login`). */
  form?: Record<string, string>
  /** Attach the bearer token. Default true. */
  auth?: boolean
  signal?: AbortSignal
}

export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, form, auth = true, signal } = options
  const headers: Record<string, string> = {}

  if (auth) {
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  let payload: BodyInit | undefined
  if (form) {
    headers["Content-Type"] = "application/x-www-form-urlencoded"
    payload = new URLSearchParams(form).toString()
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json"
    payload = JSON.stringify(body)
  }

  let res: Response
  try {
    res = await fetch(`/api${path}`, {
      method: form ? "POST" : method,
      headers,
      body: payload,
      signal,
    })
  } catch {
    throw new ApiError(0, "Cannot reach the SentriX backend.")
  }

  if (res.status === 401) {
    clearToken()
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
    }
  }

  if (!res.ok) {
    let detail = `Request failed (${res.status})`
    try {
      const data = (await res.json()) as { detail?: unknown }
      if (typeof data.detail === "string") detail = data.detail
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(res.status, detail)
  }

  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}
