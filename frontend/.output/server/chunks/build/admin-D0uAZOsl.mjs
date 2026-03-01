import { defineComponent, ref, watch, mergeProps, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderList, ssrRenderClass, ssrInterpolate, ssrRenderAttr, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual } from 'vue/server-renderer';
import { useRouter } from 'vue-router';
import { u as useHttpClient } from './httpClient-NJZDPBxg.mjs';
import { _ as _export_sfc } from './_plugin-vue_export-helper-1tPrXgE0.mjs';
import './server.mjs';
import '../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'devalue';
import '@unhead/ssr';
import 'unhead';
import '@unhead/shared';

const studentsApi = {
  /**
   * Fetch all students with optional search and pagination
   */
  async fetchStudents(query) {
    const httpClient = useHttpClient();
    const params = new URLSearchParams();
    if (query == null ? void 0 : query.search) params.append("search", query.search);
    if (query == null ? void 0 : query.page) params.append("page", query.page.toString());
    if (query == null ? void 0 : query.limit) params.append("limit", query.limit.toString());
    const queryString = params.toString() ? `?${params.toString()}` : "";
    return httpClient.get(`/students${queryString}`);
  },
  /**
   * Fetch student by ID
   */
  async fetchStudentById(id) {
    const httpClient = useHttpClient();
    return httpClient.get(`/students/${id}`);
  },
  /**
   * Create a new student
   */
  async createStudent(studentData) {
    const httpClient = useHttpClient();
    return httpClient.post("/students", studentData);
  },
  /**
   * Update student by ID
   */
  async updateStudent(id, studentData) {
    const httpClient = useHttpClient();
    return httpClient.patch(`/students/${id}`, studentData);
  },
  /**
   * Delete student by ID
   */
  async deleteStudent(id) {
    const httpClient = useHttpClient();
    await httpClient.delete(`/students/${id}`);
  }
};
const teachersApi = {
  /**
   * Fetch all teachers with optional search and pagination
   */
  async fetchTeachers(query) {
    const httpClient = useHttpClient();
    const params = new URLSearchParams();
    if (query == null ? void 0 : query.search) params.append("search", query.search);
    if (query == null ? void 0 : query.page) params.append("page", query.page.toString());
    if (query == null ? void 0 : query.limit) params.append("limit", query.limit.toString());
    const queryString = params.toString() ? `?${params.toString()}` : "";
    return httpClient.get(`/teachers${queryString}`);
  },
  /**
   * Fetch teacher by ID
   */
  async fetchTeacherById(id) {
    const httpClient = useHttpClient();
    return httpClient.get(`/teachers/${id}`);
  },
  /**
   * Create a new teacher
   */
  async createTeacher(teacherData) {
    const httpClient = useHttpClient();
    return httpClient.post("/teachers", teacherData);
  },
  /**
   * Update teacher by ID
   */
  async updateTeacher(id, teacherData) {
    const httpClient = useHttpClient();
    return httpClient.patch(`/teachers/${id}`, teacherData);
  },
  /**
   * Delete teacher by ID
   */
  async deleteTeacher(id) {
    const httpClient = useHttpClient();
    await httpClient.delete(`/teachers/${id}`);
  },
  /**
   * Assign subjects to teacher
   */
  async assignSubjects(teacherId, subjectIds) {
    const httpClient = useHttpClient();
    await httpClient.post(`/teachers/${teacherId}/subjects`, { subjectIds });
  }
};
const subjectsApi = {
  /**
   * Fetch all subjects with optional filters
   */
  async fetchSubjects(filters) {
    const httpClient = useHttpClient();
    const params = new URLSearchParams();
    if (filters == null ? void 0 : filters.teacherId) {
      params.append("teacherId", filters.teacherId.toString());
    }
    if (filters == null ? void 0 : filters.semester) {
      params.append("semester", filters.semester.toString());
    }
    if (filters == null ? void 0 : filters.page) {
      params.append("page", filters.page.toString());
    }
    if (filters == null ? void 0 : filters.limit) {
      params.append("limit", filters.limit.toString());
    }
    if (filters == null ? void 0 : filters.search) {
      params.append("search", filters.search);
    }
    const query = params.toString() ? `?${params.toString()}` : "";
    return httpClient.get(`/subjects${query}`);
  },
  /**
   * Fetch subject by ID
   */
  async fetchSubjectById(id) {
    const httpClient = useHttpClient();
    return httpClient.get(`/subjects/${id}`);
  },
  /**
   * Create a new subject
   */
  async createSubject(subjectData) {
    const httpClient = useHttpClient();
    return httpClient.post("/subjects", subjectData);
  },
  /**
   * Update subject by ID
   */
  async updateSubject(id, subjectData) {
    const httpClient = useHttpClient();
    return httpClient.patch(`/subjects/${id}`, subjectData);
  },
  /**
   * Delete subject by ID
   */
  async deleteSubject(id) {
    const httpClient = useHttpClient();
    await httpClient.delete(`/subjects/${id}`);
  },
  /**
   * Assign groups to subject
   */
  async assignGroups(subjectId, groupIds) {
    const httpClient = useHttpClient();
    await httpClient.post(`/subjects/${subjectId}/groups`, { groupIds });
  },
  /**
   * Assign teachers to subject
   */
  async assignTeachers(subjectId, teacherIds) {
    const httpClient = useHttpClient();
    await httpClient.post(`/subjects/${subjectId}/teachers`, { teacherIds });
  }
};
async function fetchGroups(params) {
  const httpClient = useHttpClient();
  const queryParams = new URLSearchParams();
  if (params == null ? void 0 : params.search) {
    queryParams.append("search", params.search);
  }
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";
  const response = await httpClient.get(`/groups${queryString}`);
  return response.data;
}
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "admin",
  __ssrInlineRender: true,
  setup(__props) {
    useRouter();
    const tabs = [
      { id: "students", label: "\u0421\u0442\u0443\u0434\u0435\u043D\u0442\u044B" },
      { id: "teachers", label: "\u041F\u0440\u0435\u043F\u043E\u0434\u0430\u0432\u0430\u0442\u0435\u043B\u0438" },
      { id: "subjects", label: "\u0414\u0438\u0441\u0446\u0438\u043F\u043B\u0438\u043D\u044B" },
      { id: "groups", label: "\u0413\u0440\u0443\u043F\u043F\u044B" }
    ];
    const activeTab = ref("students");
    const students = ref([]);
    const loadingStudents = ref(false);
    const studentsSearch = ref("");
    const studentsGroupFilter = ref("");
    const showStudentModal = ref(false);
    const editingStudent = ref(null);
    const studentForm = ref({
      firstName: "",
      lastName: "",
      middleName: "",
      email: "",
      password: "",
      groupId: void 0,
      course: 1,
      specializationId: void 0,
      studentId: "",
      enrollmentYear: (/* @__PURE__ */ new Date()).getFullYear(),
      phone: "",
      address: "",
      birthDate: ""
    });
    const teachers = ref([]);
    const allTeachers = ref([]);
    const loadingTeachers = ref(false);
    const teachersSearch = ref("");
    const showTeacherModal = ref(false);
    const editingTeacher = ref(null);
    const teacherForm = ref({
      firstName: "",
      lastName: "",
      middleName: "",
      email: "",
      password: "",
      department: "",
      position: "",
      academicDegree: "",
      phone: "",
      officeNumber: ""
    });
    const subjects = ref([]);
    const loadingSubjects = ref(false);
    const subjectsSearch = ref("");
    const showSubjectModal = ref(false);
    const editingSubject = ref(null);
    const subjectForm = ref({
      name: "",
      code: "",
      credits: 1,
      semester: 1,
      description: "",
      teacherId: void 0
    });
    const groups = ref([]);
    const loadingGroups = ref(false);
    const groupsSearch = ref("");
    const showGroupModal = ref(false);
    const editingGroup = ref(null);
    const groupForm = ref({
      name: "",
      course: 1,
      facultyId: void 0
    });
    async function searchStudents() {
      loadingStudents.value = true;
      try {
        const result = await studentsApi.fetchStudents({
          search: studentsSearch.value,
          limit: 100
        });
        students.value = result.data;
        if (studentsGroupFilter.value) {
          students.value = students.value.filter((s) => {
            var _a;
            return ((_a = s.group) == null ? void 0 : _a.name) === studentsGroupFilter.value;
          });
        }
      } catch (error) {
        alert("\u041E\u0448\u0438\u0431\u043A\u0430 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438 \u0441\u0442\u0443\u0434\u0435\u043D\u0442\u043E\u0432: " + (error.message || "\u041D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u0430\u044F \u043E\u0448\u0438\u0431\u043A\u0430"));
      } finally {
        loadingStudents.value = false;
      }
    }
    async function searchTeachers() {
      loadingTeachers.value = true;
      try {
        const result = await teachersApi.fetchTeachers({
          search: teachersSearch.value,
          limit: 100
        });
        teachers.value = result.data;
      } catch (error) {
        alert("\u041E\u0448\u0438\u0431\u043A\u0430 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438 \u043F\u0440\u0435\u043F\u043E\u0434\u0430\u0432\u0430\u0442\u0435\u043B\u0435\u0439: " + (error.message || "\u041D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u0430\u044F \u043E\u0448\u0438\u0431\u043A\u0430"));
      } finally {
        loadingTeachers.value = false;
      }
    }
    async function searchSubjects() {
      loadingSubjects.value = true;
      try {
        const result = await subjectsApi.fetchSubjects({
          search: subjectsSearch.value,
          limit: 100
        });
        subjects.value = result.data;
      } catch (error) {
        alert("\u041E\u0448\u0438\u0431\u043A\u0430 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438 \u0434\u0438\u0441\u0446\u0438\u043F\u043B\u0438\u043D: " + (error.message || "\u041D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u0430\u044F \u043E\u0448\u0438\u0431\u043A\u0430"));
      } finally {
        loadingSubjects.value = false;
      }
    }
    async function searchGroups() {
      loadingGroups.value = true;
      try {
        const result = await fetchGroups({ search: groupsSearch.value });
        groups.value = result;
      } catch (error) {
        alert("\u041E\u0448\u0438\u0431\u043A\u0430 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438 \u0433\u0440\u0443\u043F\u043F: " + (error.message || "\u041D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u0430\u044F \u043E\u0448\u0438\u0431\u043A\u0430"));
      } finally {
        loadingGroups.value = false;
      }
    }
    watch(activeTab, async (newTab) => {
      if (newTab === "students") {
        await searchStudents();
      } else if (newTab === "teachers") {
        await searchTeachers();
      } else if (newTab === "subjects") {
        await searchSubjects();
      } else if (newTab === "groups") {
        await searchGroups();
      }
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "admin-page" }, _attrs))} data-v-192b0074><div class="container" data-v-192b0074><header class="header" data-v-192b0074><h1 data-v-192b0074>\u041F\u0430\u043D\u0435\u043B\u044C \u0430\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440\u0430</h1><button class="logout-button" data-v-192b0074>\u0412\u044B\u0439\u0442\u0438</button></header><div class="tabs" data-v-192b0074><!--[-->`);
      ssrRenderList(tabs, (tab) => {
        _push(`<button class="${ssrRenderClass(["tab", { active: activeTab.value === tab.id }])}" data-v-192b0074>${ssrInterpolate(tab.label)}</button>`);
      });
      _push(`<!--]--></div><div class="tab-content" data-v-192b0074>`);
      if (activeTab.value === "students") {
        _push(`<div class="section" data-v-192b0074><div class="section-header" data-v-192b0074><div class="search-filters" data-v-192b0074><input${ssrRenderAttr("value", studentsSearch.value)} type="text" placeholder="\u041F\u043E\u0438\u0441\u043A \u043F\u043E \u0438\u043C\u0435\u043D\u0438..." class="search-input" data-v-192b0074><select class="filter-select" data-v-192b0074><option value="" data-v-192b0074${ssrIncludeBooleanAttr(Array.isArray(studentsGroupFilter.value) ? ssrLooseContain(studentsGroupFilter.value, "") : ssrLooseEqual(studentsGroupFilter.value, "")) ? " selected" : ""}>\u0412\u0441\u0435 \u0433\u0440\u0443\u043F\u043F\u044B</option><!--[-->`);
        ssrRenderList(groups.value, (group) => {
          _push(`<option${ssrRenderAttr("value", group.name)} data-v-192b0074${ssrIncludeBooleanAttr(Array.isArray(studentsGroupFilter.value) ? ssrLooseContain(studentsGroupFilter.value, group.name) : ssrLooseEqual(studentsGroupFilter.value, group.name)) ? " selected" : ""}>${ssrInterpolate(group.name)}</option>`);
        });
        _push(`<!--]--></select></div><button class="add-button" data-v-192b0074>+ \u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u0441\u0442\u0443\u0434\u0435\u043D\u0442\u0430</button></div>`);
        if (loadingStudents.value) {
          _push(`<div class="loading" data-v-192b0074>\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430...</div>`);
        } else if (students.value.length === 0) {
          _push(`<div class="empty" data-v-192b0074>\u0421\u0442\u0443\u0434\u0435\u043D\u0442\u044B \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u044B</div>`);
        } else {
          _push(`<div class="table-container" data-v-192b0074><table data-v-192b0074><thead data-v-192b0074><tr data-v-192b0074><th data-v-192b0074>\u0424\u0418\u041E</th><th data-v-192b0074>\u0413\u0440\u0443\u043F\u043F\u0430</th><th data-v-192b0074>Email</th><th data-v-192b0074>\u0417\u0430\u0447\u0451\u0442\u043D\u0430\u044F \u043A\u043D\u0438\u0436\u043A\u0430</th><th data-v-192b0074>\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u044F</th></tr></thead><tbody data-v-192b0074><!--[-->`);
          ssrRenderList(students.value, (student) => {
            var _a, _b;
            _push(`<tr data-v-192b0074><td data-v-192b0074>${ssrInterpolate(student.lastName)} ${ssrInterpolate(student.firstName)} ${ssrInterpolate(student.middleName)}</td><td data-v-192b0074>${ssrInterpolate(((_a = student.group) == null ? void 0 : _a.name) || "-")}</td><td data-v-192b0074>${ssrInterpolate(((_b = student.user) == null ? void 0 : _b.email) || "-")}</td><td data-v-192b0074>${ssrInterpolate(student.studentId)}</td><td class="actions" data-v-192b0074><button class="edit-btn" data-v-192b0074>\u0420\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C</button><button class="delete-btn" data-v-192b0074>\u0423\u0434\u0430\u043B\u0438\u0442\u044C</button></td></tr>`);
          });
          _push(`<!--]--></tbody></table></div>`);
        }
        _push(`</div>`);
      } else {
        _push(`<!---->`);
      }
      if (activeTab.value === "teachers") {
        _push(`<div class="section" data-v-192b0074><div class="section-header" data-v-192b0074><input${ssrRenderAttr("value", teachersSearch.value)} type="text" placeholder="\u041F\u043E\u0438\u0441\u043A \u043F\u043E \u0438\u043C\u0435\u043D\u0438..." class="search-input" data-v-192b0074><button class="add-button" data-v-192b0074>+ \u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u043F\u0440\u0435\u043F\u043E\u0434\u0430\u0432\u0430\u0442\u0435\u043B\u044F</button></div>`);
        if (loadingTeachers.value) {
          _push(`<div class="loading" data-v-192b0074>\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430...</div>`);
        } else if (teachers.value.length === 0) {
          _push(`<div class="empty" data-v-192b0074>\u041F\u0440\u0435\u043F\u043E\u0434\u0430\u0432\u0430\u0442\u0435\u043B\u0438 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u044B</div>`);
        } else {
          _push(`<div class="table-container" data-v-192b0074><table data-v-192b0074><thead data-v-192b0074><tr data-v-192b0074><th data-v-192b0074>\u0424\u0418\u041E</th><th data-v-192b0074>\u041A\u0430\u0444\u0435\u0434\u0440\u0430</th><th data-v-192b0074>\u0414\u043E\u043B\u0436\u043D\u043E\u0441\u0442\u044C</th><th data-v-192b0074>Email</th><th data-v-192b0074>\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u044F</th></tr></thead><tbody data-v-192b0074><!--[-->`);
          ssrRenderList(teachers.value, (teacher) => {
            var _a;
            _push(`<tr data-v-192b0074><td data-v-192b0074>${ssrInterpolate(teacher.lastName)} ${ssrInterpolate(teacher.firstName)} ${ssrInterpolate(teacher.middleName)}</td><td data-v-192b0074>${ssrInterpolate(teacher.department)}</td><td data-v-192b0074>${ssrInterpolate(teacher.position)}</td><td data-v-192b0074>${ssrInterpolate(((_a = teacher.user) == null ? void 0 : _a.email) || "-")}</td><td class="actions" data-v-192b0074><button class="edit-btn" data-v-192b0074>\u0420\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C</button><button class="delete-btn" data-v-192b0074>\u0423\u0434\u0430\u043B\u0438\u0442\u044C</button></td></tr>`);
          });
          _push(`<!--]--></tbody></table></div>`);
        }
        _push(`</div>`);
      } else {
        _push(`<!---->`);
      }
      if (activeTab.value === "subjects") {
        _push(`<div class="section" data-v-192b0074><div class="section-header" data-v-192b0074><input${ssrRenderAttr("value", subjectsSearch.value)} type="text" placeholder="\u041F\u043E\u0438\u0441\u043A \u043F\u043E \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u044E..." class="search-input" data-v-192b0074><button class="add-button" data-v-192b0074>+ \u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u0434\u0438\u0441\u0446\u0438\u043F\u043B\u0438\u043D\u0443</button></div>`);
        if (loadingSubjects.value) {
          _push(`<div class="loading" data-v-192b0074>\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430...</div>`);
        } else if (subjects.value.length === 0) {
          _push(`<div class="empty" data-v-192b0074>\u0414\u0438\u0441\u0446\u0438\u043F\u043B\u0438\u043D\u044B \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u044B</div>`);
        } else {
          _push(`<div class="table-container" data-v-192b0074><table data-v-192b0074><thead data-v-192b0074><tr data-v-192b0074><th data-v-192b0074>\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435</th><th data-v-192b0074>\u041A\u043E\u0434</th><th data-v-192b0074>\u041A\u0440\u0435\u0434\u0438\u0442\u044B</th><th data-v-192b0074>\u0421\u0435\u043C\u0435\u0441\u0442\u0440</th><th data-v-192b0074>\u041F\u0440\u0435\u043F\u043E\u0434\u0430\u0432\u0430\u0442\u0435\u043B\u044C</th><th data-v-192b0074>\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u044F</th></tr></thead><tbody data-v-192b0074><!--[-->`);
          ssrRenderList(subjects.value, (subject) => {
            _push(`<tr data-v-192b0074><td data-v-192b0074>${ssrInterpolate(subject.name)}</td><td data-v-192b0074>${ssrInterpolate(subject.code)}</td><td data-v-192b0074>${ssrInterpolate(subject.credits)}</td><td data-v-192b0074>${ssrInterpolate(subject.semester)}</td><td data-v-192b0074>${ssrInterpolate(subject.teacher ? `${subject.teacher.lastName} ${subject.teacher.firstName.charAt(0)}.` : "-")}</td><td class="actions" data-v-192b0074><button class="edit-btn" data-v-192b0074>\u0420\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C</button><button class="delete-btn" data-v-192b0074>\u0423\u0434\u0430\u043B\u0438\u0442\u044C</button></td></tr>`);
          });
          _push(`<!--]--></tbody></table></div>`);
        }
        _push(`</div>`);
      } else {
        _push(`<!---->`);
      }
      if (activeTab.value === "groups") {
        _push(`<div class="section" data-v-192b0074><div class="section-header" data-v-192b0074><input${ssrRenderAttr("value", groupsSearch.value)} type="text" placeholder="\u041F\u043E\u0438\u0441\u043A \u043F\u043E \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u044E..." class="search-input" data-v-192b0074><button class="add-button" data-v-192b0074>+ \u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u0433\u0440\u0443\u043F\u043F\u0443</button></div>`);
        if (loadingGroups.value) {
          _push(`<div class="loading" data-v-192b0074>\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430...</div>`);
        } else if (groups.value.length === 0) {
          _push(`<div class="empty" data-v-192b0074>\u0413\u0440\u0443\u043F\u043F\u044B \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u044B</div>`);
        } else {
          _push(`<div class="table-container" data-v-192b0074><table data-v-192b0074><thead data-v-192b0074><tr data-v-192b0074><th data-v-192b0074>\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435</th><th data-v-192b0074>\u041A\u0443\u0440\u0441</th><th data-v-192b0074>\u0424\u0430\u043A\u0443\u043B\u044C\u0442\u0435\u0442</th><th data-v-192b0074>\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u044F</th></tr></thead><tbody data-v-192b0074><!--[-->`);
          ssrRenderList(groups.value, (group) => {
            _push(`<tr data-v-192b0074><td data-v-192b0074>${ssrInterpolate(group.name)}</td><td data-v-192b0074>${ssrInterpolate(group.course)}</td><td data-v-192b0074>-</td><td class="actions" data-v-192b0074><button class="edit-btn" data-v-192b0074>\u0420\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C</button><button class="delete-btn" data-v-192b0074>\u0423\u0434\u0430\u043B\u0438\u0442\u044C</button></td></tr>`);
          });
          _push(`<!--]--></tbody></table></div>`);
        }
        _push(`</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div>`);
      if (showStudentModal.value) {
        _push(`<div class="modal-overlay" data-v-192b0074><div class="modal" data-v-192b0074><h2 data-v-192b0074>${ssrInterpolate(editingStudent.value ? "\u0420\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u0441\u0442\u0443\u0434\u0435\u043D\u0442\u0430" : "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u0441\u0442\u0443\u0434\u0435\u043D\u0442\u0430")}</h2><form class="form" data-v-192b0074><div class="form-row" data-v-192b0074><div class="form-field" data-v-192b0074><label data-v-192b0074>\u0424\u0430\u043C\u0438\u043B\u0438\u044F *</label><input${ssrRenderAttr("value", studentForm.value.lastName)} required type="text" data-v-192b0074></div><div class="form-field" data-v-192b0074><label data-v-192b0074>\u0418\u043C\u044F *</label><input${ssrRenderAttr("value", studentForm.value.firstName)} required type="text" data-v-192b0074></div></div><div class="form-row" data-v-192b0074><div class="form-field" data-v-192b0074><label data-v-192b0074>\u041E\u0442\u0447\u0435\u0441\u0442\u0432\u043E</label><input${ssrRenderAttr("value", studentForm.value.middleName)} type="text" data-v-192b0074></div><div class="form-field" data-v-192b0074><label data-v-192b0074>Email *</label><input${ssrRenderAttr("value", studentForm.value.email)} required type="email" data-v-192b0074></div></div>`);
        if (!editingStudent.value) {
          _push(`<div class="form-row" data-v-192b0074><div class="form-field" data-v-192b0074><label data-v-192b0074>\u041F\u0430\u0440\u043E\u043B\u044C *</label><input${ssrRenderAttr("value", studentForm.value.password)} required type="password" data-v-192b0074></div></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="form-row" data-v-192b0074><div class="form-field" data-v-192b0074><label data-v-192b0074>\u0413\u0440\u0443\u043F\u043F\u0430</label><select data-v-192b0074><option${ssrRenderAttr("value", void 0)} data-v-192b0074${ssrIncludeBooleanAttr(Array.isArray(studentForm.value.groupId) ? ssrLooseContain(studentForm.value.groupId, void 0) : ssrLooseEqual(studentForm.value.groupId, void 0)) ? " selected" : ""}>\u041D\u0435 \u0432\u044B\u0431\u0440\u0430\u043D\u0430</option><!--[-->`);
        ssrRenderList(groups.value, (group) => {
          _push(`<option${ssrRenderAttr("value", group.id)} data-v-192b0074${ssrIncludeBooleanAttr(Array.isArray(studentForm.value.groupId) ? ssrLooseContain(studentForm.value.groupId, group.id) : ssrLooseEqual(studentForm.value.groupId, group.id)) ? " selected" : ""}>${ssrInterpolate(group.name)}</option>`);
        });
        _push(`<!--]--></select></div><div class="form-field" data-v-192b0074><label data-v-192b0074>\u041A\u0443\u0440\u0441 *</label><input${ssrRenderAttr("value", studentForm.value.course)} required type="number" min="1" max="6" data-v-192b0074></div></div><div class="form-row" data-v-192b0074><div class="form-field" data-v-192b0074><label data-v-192b0074>\u0421\u043F\u0435\u0446\u0438\u0430\u043B\u0438\u0437\u0430\u0446\u0438\u044F</label><input${ssrRenderAttr("value", studentForm.value.specializationId)} type="number" placeholder="ID \u0441\u043F\u0435\u0446\u0438\u0430\u043B\u0438\u0437\u0430\u0446\u0438\u0438 (\u043E\u043F\u0446\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u043E)" data-v-192b0074></div></div><div class="form-row" data-v-192b0074><div class="form-field" data-v-192b0074><label data-v-192b0074>\u041D\u043E\u043C\u0435\u0440 \u0437\u0430\u0447\u0451\u0442\u043A\u0438 *</label><input${ssrRenderAttr("value", studentForm.value.studentId)} required type="text" data-v-192b0074></div><div class="form-field" data-v-192b0074><label data-v-192b0074>\u0413\u043E\u0434 \u043F\u043E\u0441\u0442\u0443\u043F\u043B\u0435\u043D\u0438\u044F *</label><input${ssrRenderAttr("value", studentForm.value.enrollmentYear)} required type="number" min="2000" max="2030" data-v-192b0074></div></div><div class="form-row" data-v-192b0074><div class="form-field" data-v-192b0074><label data-v-192b0074>\u0422\u0435\u043B\u0435\u0444\u043E\u043D</label><input${ssrRenderAttr("value", studentForm.value.phone)} type="tel" data-v-192b0074></div><div class="form-field" data-v-192b0074><label data-v-192b0074>\u0414\u0430\u0442\u0430 \u0440\u043E\u0436\u0434\u0435\u043D\u0438\u044F</label><input${ssrRenderAttr("value", studentForm.value.birthDate)} type="date" data-v-192b0074></div></div><div class="form-field" data-v-192b0074><label data-v-192b0074>\u0410\u0434\u0440\u0435\u0441</label><input${ssrRenderAttr("value", studentForm.value.address)} type="text" data-v-192b0074></div><div class="modal-actions" data-v-192b0074><button type="button" class="cancel-btn" data-v-192b0074>\u041E\u0442\u043C\u0435\u043D\u0430</button><button type="submit" class="submit-btn" data-v-192b0074>${ssrInterpolate(editingStudent.value ? "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C" : "\u0421\u043E\u0437\u0434\u0430\u0442\u044C")}</button></div></form></div></div>`);
      } else {
        _push(`<!---->`);
      }
      if (showTeacherModal.value) {
        _push(`<div class="modal-overlay" data-v-192b0074><div class="modal" data-v-192b0074><h2 data-v-192b0074>${ssrInterpolate(editingTeacher.value ? "\u0420\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u043F\u0440\u0435\u043F\u043E\u0434\u0430\u0432\u0430\u0442\u0435\u043B\u044F" : "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u043F\u0440\u0435\u043F\u043E\u0434\u0430\u0432\u0430\u0442\u0435\u043B\u044F")}</h2><form class="form" data-v-192b0074><div class="form-row" data-v-192b0074><div class="form-field" data-v-192b0074><label data-v-192b0074>\u0424\u0430\u043C\u0438\u043B\u0438\u044F *</label><input${ssrRenderAttr("value", teacherForm.value.lastName)} required type="text" data-v-192b0074></div><div class="form-field" data-v-192b0074><label data-v-192b0074>\u0418\u043C\u044F *</label><input${ssrRenderAttr("value", teacherForm.value.firstName)} required type="text" data-v-192b0074></div></div><div class="form-row" data-v-192b0074><div class="form-field" data-v-192b0074><label data-v-192b0074>\u041E\u0442\u0447\u0435\u0441\u0442\u0432\u043E</label><input${ssrRenderAttr("value", teacherForm.value.middleName)} type="text" data-v-192b0074></div><div class="form-field" data-v-192b0074><label data-v-192b0074>Email *</label><input${ssrRenderAttr("value", teacherForm.value.email)} required type="email" data-v-192b0074></div></div>`);
        if (!editingTeacher.value) {
          _push(`<div class="form-row" data-v-192b0074><div class="form-field" data-v-192b0074><label data-v-192b0074>\u041F\u0430\u0440\u043E\u043B\u044C *</label><input${ssrRenderAttr("value", teacherForm.value.password)} required type="password" data-v-192b0074></div></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="form-row" data-v-192b0074><div class="form-field" data-v-192b0074><label data-v-192b0074>\u041A\u0430\u0444\u0435\u0434\u0440\u0430 *</label><input${ssrRenderAttr("value", teacherForm.value.department)} required type="text" data-v-192b0074></div><div class="form-field" data-v-192b0074><label data-v-192b0074>\u0414\u043E\u043B\u0436\u043D\u043E\u0441\u0442\u044C *</label><input${ssrRenderAttr("value", teacherForm.value.position)} required type="text" data-v-192b0074></div></div><div class="form-row" data-v-192b0074><div class="form-field" data-v-192b0074><label data-v-192b0074>\u0423\u0447\u0451\u043D\u0430\u044F \u0441\u0442\u0435\u043F\u0435\u043D\u044C</label><input${ssrRenderAttr("value", teacherForm.value.academicDegree)} type="text" data-v-192b0074></div><div class="form-field" data-v-192b0074><label data-v-192b0074>\u0422\u0435\u043B\u0435\u0444\u043E\u043D</label><input${ssrRenderAttr("value", teacherForm.value.phone)} type="tel" data-v-192b0074></div></div><div class="form-field" data-v-192b0074><label data-v-192b0074>\u041D\u043E\u043C\u0435\u0440 \u043A\u0430\u0431\u0438\u043D\u0435\u0442\u0430</label><input${ssrRenderAttr("value", teacherForm.value.officeNumber)} type="text" data-v-192b0074></div><div class="modal-actions" data-v-192b0074><button type="button" class="cancel-btn" data-v-192b0074>\u041E\u0442\u043C\u0435\u043D\u0430</button><button type="submit" class="submit-btn" data-v-192b0074>${ssrInterpolate(editingTeacher.value ? "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C" : "\u0421\u043E\u0437\u0434\u0430\u0442\u044C")}</button></div></form></div></div>`);
      } else {
        _push(`<!---->`);
      }
      if (showSubjectModal.value) {
        _push(`<div class="modal-overlay" data-v-192b0074><div class="modal" data-v-192b0074><h2 data-v-192b0074>${ssrInterpolate(editingSubject.value ? "\u0420\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u0434\u0438\u0441\u0446\u0438\u043F\u043B\u0438\u043D\u0443" : "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u0434\u0438\u0441\u0446\u0438\u043F\u043B\u0438\u043D\u0443")}</h2><form class="form" data-v-192b0074><div class="form-row" data-v-192b0074><div class="form-field" data-v-192b0074><label data-v-192b0074>\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 *</label><input${ssrRenderAttr("value", subjectForm.value.name)} required type="text" data-v-192b0074></div><div class="form-field" data-v-192b0074><label data-v-192b0074>\u041A\u043E\u0434 *</label><input${ssrRenderAttr("value", subjectForm.value.code)} required type="text" data-v-192b0074></div></div><div class="form-row" data-v-192b0074><div class="form-field" data-v-192b0074><label data-v-192b0074>\u041A\u0440\u0435\u0434\u0438\u0442\u044B *</label><input${ssrRenderAttr("value", subjectForm.value.credits)} required type="number" min="1" max="10" data-v-192b0074></div><div class="form-field" data-v-192b0074><label data-v-192b0074>\u0421\u0435\u043C\u0435\u0441\u0442\u0440 *</label><input${ssrRenderAttr("value", subjectForm.value.semester)} required type="number" min="1" max="12" data-v-192b0074></div></div><div class="form-field" data-v-192b0074><label data-v-192b0074>\u041F\u0440\u0435\u043F\u043E\u0434\u0430\u0432\u0430\u0442\u0435\u043B\u044C</label><select data-v-192b0074><option${ssrRenderAttr("value", void 0)} data-v-192b0074${ssrIncludeBooleanAttr(Array.isArray(subjectForm.value.teacherId) ? ssrLooseContain(subjectForm.value.teacherId, void 0) : ssrLooseEqual(subjectForm.value.teacherId, void 0)) ? " selected" : ""}>\u041D\u0435 \u043D\u0430\u0437\u043D\u0430\u0447\u0435\u043D</option><!--[-->`);
        ssrRenderList(allTeachers.value, (teacher) => {
          _push(`<option${ssrRenderAttr("value", teacher.id)} data-v-192b0074${ssrIncludeBooleanAttr(Array.isArray(subjectForm.value.teacherId) ? ssrLooseContain(subjectForm.value.teacherId, teacher.id) : ssrLooseEqual(subjectForm.value.teacherId, teacher.id)) ? " selected" : ""}>${ssrInterpolate(teacher.lastName)} ${ssrInterpolate(teacher.firstName)}</option>`);
        });
        _push(`<!--]--></select></div><div class="form-field" data-v-192b0074><label data-v-192b0074>\u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435</label><textarea rows="3" data-v-192b0074>${ssrInterpolate(subjectForm.value.description)}</textarea></div><div class="modal-actions" data-v-192b0074><button type="button" class="cancel-btn" data-v-192b0074>\u041E\u0442\u043C\u0435\u043D\u0430</button><button type="submit" class="submit-btn" data-v-192b0074>${ssrInterpolate(editingSubject.value ? "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C" : "\u0421\u043E\u0437\u0434\u0430\u0442\u044C")}</button></div></form></div></div>`);
      } else {
        _push(`<!---->`);
      }
      if (showGroupModal.value) {
        _push(`<div class="modal-overlay" data-v-192b0074><div class="modal" data-v-192b0074><h2 data-v-192b0074>${ssrInterpolate(editingGroup.value ? "\u0420\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u0433\u0440\u0443\u043F\u043F\u0443" : "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u0433\u0440\u0443\u043F\u043F\u0443")}</h2><form class="form" data-v-192b0074><div class="form-field" data-v-192b0074><label data-v-192b0074>\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 *</label><input${ssrRenderAttr("value", groupForm.value.name)} required type="text" placeholder="\u041D\u0430\u043F\u0440\u0438\u043C\u0435\u0440: \u0418\u0421-201" data-v-192b0074></div><div class="form-row" data-v-192b0074><div class="form-field" data-v-192b0074><label data-v-192b0074>\u041A\u0443\u0440\u0441 *</label><input${ssrRenderAttr("value", groupForm.value.course)} required type="number" min="1" max="6" data-v-192b0074></div></div><div class="modal-actions" data-v-192b0074><button type="button" class="cancel-btn" data-v-192b0074>\u041E\u0442\u043C\u0435\u043D\u0430</button><button type="submit" class="submit-btn" data-v-192b0074>${ssrInterpolate(editingGroup.value ? "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C" : "\u0421\u043E\u0437\u0434\u0430\u0442\u044C")}</button></div></form></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/admin.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const admin = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-192b0074"]]);

export { admin as default };
//# sourceMappingURL=admin-D0uAZOsl.mjs.map
