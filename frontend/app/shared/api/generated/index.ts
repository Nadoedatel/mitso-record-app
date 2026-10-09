import type { components } from './schema'

/**
 * Request bodies of the backend, generated from backend/openapi.json (`npm run api:types`).
 * Do not edit schema.d.ts by hand: change the Zod DTO in the backend, then regenerate.
 */
export type ApiSchemas = components['schemas']
