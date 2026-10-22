import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { EXPORT_STUDENT_JOB, IMPORT_STUDENTS_JOB } from '../jobs.constants';

/** What a finished job produced: the file of an export or the summary of an import */
export const jobResultSchema = z.object({
  fileName: z.string().optional().meta({ description: 'Export: name of the generated file' }),
  size: z.number().int().optional().meta({ description: 'Export: file size in bytes' }),
  total: z.number().int().optional().meta({ description: 'Import: rows in the file' }),
  created: z.number().int().optional().meta({ description: 'Import: students created' }),
  skipped: z.number().int().optional().meta({ description: 'Import: rows skipped because the email is already registered' }),
  failed: z.number().int().optional().meta({ description: 'Import: rows with errors' }),
  errors: z
    .array(z.object({ row: z.number().int().meta({ description: 'Line in the file' }), reason: z.string() }))
    .optional(),
});

export type JobResult = z.infer<typeof jobResultSchema>;

/** State of a background job, as polled by the client */
export const jobStatusSchema = z.object({
  id: z.string(),
  kind: z.enum([EXPORT_STUDENT_JOB, IMPORT_STUDENTS_JOB]),
  state: z.enum(['waiting', 'active', 'completed', 'failed', 'delayed']),
  progress: z.number().int().min(0).max(100),
  attemptsMade: z.number().int(),
  failedReason: z.string().nullable(),
  result: jobResultSchema.nullable(),
});

export type JobStatus = z.infer<typeof jobStatusSchema>;

export class JobStatusResponseDto extends createZodDto(jobStatusSchema) {}
