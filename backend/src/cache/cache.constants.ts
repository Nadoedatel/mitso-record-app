/**
 * Cache namespace for reference data: faculties, specializations, groups, subjects.
 * Their responses embed each other and the students/teachers lists (a group carries its students,
 * a subject its teachers and groups, a faculty its counts), so they are invalidated together:
 * any write to any of them bumps this one namespace. Coarse, but always correct.
 */
export const DIRECTORY_NAMESPACE = 'directory';

/**
 * Safety net: even if some write forgets to invalidate, stale data disappears after this long.
 */
export const DIRECTORY_TTL_SECONDS = 300;
