// One pass over every endpoint the load test uses, with one user. Run it first: if this fails, the load test is pointless.
//   load/run-k6.sh smoke.js
import { get, prepare } from './lib.js';

export const options = {
  vus: 1,
  iterations: 1,
  thresholds: { checks: ['rate==1'], http_req_failed: ['rate==0'] },
};

export function setup() {
  return prepare();
}

export default function (ctx) {
  get('/api/groups?limit=20', ctx.student, 'groups_list');
  get('/api/faculties', ctx.student, 'faculties_list');
  get('/api/specializations', ctx.student, 'specializations_list');
  get('/api/subjects?search=Subject%201', ctx.admin, 'subjects_search');
  get(`/api/students?search=${encodeURIComponent('иванов иван')}&limit=20`, ctx.admin, 'students_search');
  get(`/api/grades?subjectId=${ctx.subjectId}`, ctx.admin, 'grades_by_subject');
  get(`/api/grades/student/${ctx.studentId}`, ctx.student, 'grades_of_student');
  get(`/api/grades/subject/${ctx.subjectId}/group/${ctx.groupId}/students`, ctx.teacher, 'grade_entry_screen');
}
