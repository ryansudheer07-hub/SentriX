import { apiFetch, clearToken, setToken } from "./client"
import type { ApiToken, ApiUser } from "./types"

/** Exchange credentials for a JWT and store it. */
export async function login(
  username: string,
  password: string
): Promise<ApiUser> {
  const token = await apiFetch<ApiToken>("/auth/login", {
    form: { username, password },
    auth: false,
  })
  setToken(token.access_token)
  try {
    return await me()
  } catch (err) {
    clearToken()
    throw err
  }
}

/** Current user for the stored token. Throws (401) if the token is invalid. */
export function me(): Promise<ApiUser> {
  return apiFetch<ApiUser>("/auth/me")
}

export function logout(): void {
  clearToken()
}
