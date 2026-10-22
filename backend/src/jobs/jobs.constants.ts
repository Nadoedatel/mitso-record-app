/** Name of the BullMQ queue that carries every background job of the app */
export const JOBS_QUEUE = 'background';

/** Job names inside the queue (also the `kind` stored in the job data) */
export const EXPORT_STUDENT_JOB = 'export-student';
export const IMPORT_STUDENTS_JOB = 'import-students';

/** How many jobs one process runs at the same time */
export const WORKER_CONCURRENCY = 2;

/** Attempts for transient failures (database or Redis hiccup); row validation errors are never retried */
export const JOB_ATTEMPTS = 3;
export const JOB_BACKOFF_MS = 1000;

/** How long finished jobs and generated files stay in Redis */
export const COMPLETED_JOB_TTL_SECONDS = 60 * 60;
export const FAILED_JOB_TTL_SECONDS = 24 * 60 * 60;
export const FILE_TTL_SECONDS = 60 * 60;

/** Limits of a CSV import (checked on upload, so the user gets the answer at once) */
export const MAX_CSV_BYTES = 1024 * 1024;
export const MAX_CSV_ROWS = 1000;

export const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
