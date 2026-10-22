import http from 'k6/http';
import { check, fail } from 'k6';

export const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
export const PASSWORD = 'password123';

/** Header set for an authenticated call; `endpoint` becomes a tag, so thresholds and reports can tell calls apart */
export function authed(token, endpoint) {
  return { headers: { Authorization: `Bearer ${token}` }, tags: { endpoint } };
}

/** GET with a bearer token and a check for 200 */
export function get(path, token, endpoint) {
  const res = http.get(`${BASE_URL}${path}`, authed(token, endpoint));
  check(res, { [`${endpoint}: status 200`]: (r) => r.status === 200 });
  return res;
}

/**
 * Logs in and returns the access token.
 * POST /auth/login allows 10 per minute per IP: log in once per role in setup(), never in the load loop.
 */
export function login(email) {
  const res = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({ email, password: PASSWORD }), {
    headers: { 'Content-Type': 'application/json' },
    tags: { endpoint: 'login' },
  });
  if (res.status !== 200) fail(`login of ${email} failed with ${res.status}: ${res.body}`);
  const body = res.json();
  if (body.twoFactorRequired) fail(`${email} has two-factor on; the load accounts must not`);
  return body.accessToken;
}

/**
 * Logs in the three load accounts (see load/accounts.sql) and finds what the scenarios need:
 * the student's own id, a subject of the teacher, one of its groups and that group's students.
 */
export function prepare() {
  const admin = login('admin@perf.test');
  const teacher = login('teacher@perf.test');
  const student = login('student@perf.test');

  const meOf = (token) => http.get(`${BASE_URL}/api/auth/me`, authed(token, 'me')).json();
  const teacherId = meOf(teacher).teacher.id;
  const studentId = meOf(student).student.id;

  const subjects = http.get(`${BASE_URL}/api/subjects?teacherId=${teacherId}&limit=50`, authed(teacher, 'setup')).json().data;
  if (!subjects.length) fail('the teacher has no subjects: run `npm run load:seed` first');
  const subjectId = subjects[0].id;

  const groups = http.get(`${BASE_URL}/api/grades/subject/${subjectId}/groups`, authed(teacher, 'setup')).json();
  if (!groups.length) fail(`subject ${subjectId} has no groups`);
  const groupId = groups[0].id;

  const students = http
    .get(`${BASE_URL}/api/grades/subject/${subjectId}/group/${groupId}/students`, authed(teacher, 'setup'))
    .json()
    .map((s) => s.id);

  return { admin, teacher, student, studentId, subjectId, groupId, studentIds: students };
}
