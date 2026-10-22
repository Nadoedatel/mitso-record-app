import createClient, { type Middleware } from 'openapi-fetch'
import type { paths } from './generated/schema'
import { ApiError } from './ApiError'
import { HttpClient, useHttpClient } from './httpClient'

/** Throws ApiError for non-2xx responses, so callers get `data` or an exception, never `{ error }` */
function throwOnErrorResponse(http: HttpClient): Middleware {
  return {
    async onResponse({ response, schemaPath }) {
      if (!response.ok) throw await http.toApiError(response, schemaPath)
      return undefined
    },
  }
}

/**
 * Typed client over the OpenAPI spec (`paths` is generated from backend/openapi.json).
 * Transport is the existing HttpClient: bearer token, refresh on 401, ApiError, x-request-id.
 * The spec paths already contain the `/api` prefix, so the base URL is the API URL without it.
 */
export function createApiClient(http: HttpClient, apiUrl: string) {
  const client = createClient<paths>({
    baseUrl: apiUrl.replace(/\/api\/?$/, ''),
    credentials: 'include',
    fetch: (request) => http.authorizedFetch(request),
  })
  client.use(throwOnErrorResponse(http))
  return client
}

export type ApiClient = ReturnType<typeof createApiClient>

let apiClient: ApiClient | undefined

/** Singleton like `useHttpClient()`; call at the top level of a component or composable */
export const useApiClient = (): ApiClient => {
  if (!apiClient) {
    const config = useRuntimeConfig()
    apiClient = createApiClient(useHttpClient(), config.public.apiUrl as string)
  }
  return apiClient
}

/** Body of a successful call; an empty body where the spec promises one is a server bug */
export function payload<T>(result: { data?: T }): T {
  if (result.data === undefined) throw new ApiError('Пустой ответ сервера', 0)
  return result.data
}
