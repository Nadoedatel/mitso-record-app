import { z } from 'zod';

/**
 * Date as sent by clients: a plain date ("2026-01-15") or a full ISO timestamp.
 * z.iso.datetime() alone would reject the plain date the frontend sends.
 */
export const dateOrDateTime = z.union([z.iso.date(), z.iso.datetime()]);

/** Database id: a positive integer */
export const idSchema = z.number().int().positive();

/** Non-empty list of ids (assign endpoints) */
export const idListSchema = z.array(idSchema).min(1);

/**
 * Query-string id filter ("?groupId=3"): coerced from string to a positive integer.
 */
export const queryId = z.coerce.number().int().positive();
