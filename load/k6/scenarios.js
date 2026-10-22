// Load test: many readers (the screens people open all day) and a few teachers saving grades in batches.
//   load/run-k6.sh scenarios.js
// Needs the backend started with `npm run load:backend` (general rate limit lifted) and data from `npm run load:seed`.
// Thresholds are the pass/fail rules: k6 exits with an error when one is broken.
import http from 'k6/http';
import { check, sleep } from 'k6';
import { authed, BASE_URL, get, prepare } from './lib.js';

export const options = {
  scenarios: {
    readers: {
      executor: 'ramping-vus',
      exec: 'readers',
      stages: [
        { duration: '20s', target: 20 },
        { duration: '1m', target: 20 },
        { duration: '10s', target: 0 },
      ],
    },
    graders: { executor: 'constant-vus', exec: 'graders', vus: 3, duration: '1m30s' },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    checks: ['rate>0.99'],
    // Reference data comes from the cache, lists are indexed: these must stay fast
    'http_req_duration{endpoint:groups_list}': ['p(95)<150'],
    'http_req_duration{endpoint:faculties_list}': ['p(95)<150'],
    'http_req_duration{endpoint:grades_of_student}': ['p(95)<200'],
    'http_req_duration{endpoint:grade_entry_screen}': ['p(95)<300'],
    'http_req_duration{endpoint:grades_by_subject}': ['p(95)<300'],
    // ILIKE '%text%' served by the pg_trgm GIN indexes (migration add_student_search_trigram_indexes); still the
    // loosest limit, the first to watch. Tighten it after the first run, compare with the plans of scripts/perf/trigram.sql
    'http_req_duration{endpoint:students_search}': ['p(95)<500'],
    'http_req_duration{endpoint:grades_batch}': ['p(95)<800'],
  },
};

export function setup() {
  return prepare();
}

// Cyrillic like the real data, one and two words: the second kind is what the trigram indexes and the AND of words serve
const SEARCHES = ['иван', 'петр', 'анна', 'ольга', 'сидоров', 'козлов', 'иванов иван', 'Петров Сергей'];
const pick = (list) => list[Math.floor(Math.random() * list.length)];

/** One "visit": a random screen, then a pause like a person reading it */
export function readers(ctx) {
  const roll = Math.random();
  if (roll < 0.2) get(`/api/groups?limit=20&page=${1 + Math.floor(Math.random() * 20)}`, ctx.student, 'groups_list');
  else if (roll < 0.3) get('/api/faculties', ctx.student, 'faculties_list');
  else if (roll < 0.35) get('/api/specializations', ctx.student, 'specializations_list');
  else if (roll < 0.45) get(`/api/subjects?search=Subject%20${1 + Math.floor(Math.random() * 20)}`, ctx.admin, 'subjects_search');
  else if (roll < 0.6) get(`/api/students?search=${encodeURIComponent(pick(SEARCHES))}&limit=20`, ctx.admin, 'students_search');
  else if (roll < 0.75) get(`/api/grades?subjectId=${ctx.subjectId}`, ctx.admin, 'grades_by_subject');
  else if (roll < 0.9) get(`/api/grades/student/${ctx.studentId}`, ctx.student, 'grades_of_student');
  else get(`/api/grades/subject/${ctx.subjectId}/group/${ctx.groupId}/students`, ctx.teacher, 'grade_entry_screen');
  sleep(0.5 + Math.random());
}

/** A teacher saves marks for the first ten students of a group in one request (the grade entry screen) */
export function graders(ctx) {
  const grades = ctx.studentIds.slice(0, 10).map((studentId) => ({
    studentId,
    subjectId: ctx.subjectId,
    gradeType: 'EXAM',
    gradeValue: 1 + Math.floor(Math.random() * 10),
  }));
  const res = http.post(`${BASE_URL}/api/grades/batch`, JSON.stringify({ grades }), {
    ...authed(ctx.teacher, 'grades_batch'),
    headers: { ...authed(ctx.teacher, 'grades_batch').headers, 'Content-Type': 'application/json' },
  });
  check(res, {
    'grades_batch: status 201': (r) => r.status === 201,
    'grades_batch: nothing failed': (r) => r.status !== 201 || r.json().failed === 0,
  });
  sleep(1 + Math.random());
}
