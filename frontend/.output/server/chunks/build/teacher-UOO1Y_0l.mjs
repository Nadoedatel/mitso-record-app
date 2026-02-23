import { defineComponent, ref, computed, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderList, ssrRenderAttr, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrRenderClass } from 'vue/server-renderer';
import { u as useAuthStore } from './useAuth-D7OK4hbw.mjs';
import { u as useRouter } from './server.mjs';
import { _ as _export_sfc } from './_plugin-vue_export-helper-1tPrXgE0.mjs';
import './httpClient-NJZDPBxg.mjs';
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
import 'vue-router';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "teacher",
  __ssrInlineRender: true,
  setup(__props) {
    const authStore = useAuthStore();
    useRouter();
    const subjects = ref([]);
    const loading = ref(false);
    const error = ref("");
    const selectedSubjectId = ref(null);
    const selectedGroup = ref(null);
    const groups = ref([]);
    const students = ref([]);
    const groupsLoading = ref(false);
    const studentsLoading = ref(false);
    const isSaving = ref(false);
    const saveSuccess = ref(false);
    const saveError = ref("");
    const gradesForm = ref({});
    const hasValidGrades = computed(() => {
      return Object.entries(gradesForm.value).some(([_, grade]) => {
        return grade.gradeType && grade.gradeValue && grade.gradeValue >= 1 && grade.gradeValue <= 10;
      });
    });
    function getGradeTypeLabel(type) {
      const labels = {
        EXAM: "\u042D\u043A\u0437\u0430\u043C\u0435\u043D",
        CREDIT: "\u0417\u0430\u0447\u0451\u0442",
        COURSEWORK: "\u041A\u0443\u0440\u0441\u043E\u0432\u0430\u044F",
        TEST: "\u041A\u043E\u043D\u0442\u0440\u043E\u043B\u044C\u043D\u0430\u044F",
        LAB: "\u041B\u0430\u0431\u043E\u0440\u0430\u0442\u043E\u0440\u043D\u0430\u044F"
      };
      return labels[type] || type;
    }
    function getGradeClass(value) {
      if (value >= 9) return "excellent";
      if (value >= 7) return "good";
      if (value >= 5) return "satisfactory";
      return "poor";
    }
    return (_ctx, _push, _parent, _attrs) => {
      var _a, _b, _c;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "teacher-page" }, _attrs))} data-v-96d4f91a><div class="container" data-v-96d4f91a><header class="header" data-v-96d4f91a><div data-v-96d4f91a>`);
      if ((_a = unref(authStore).user) == null ? void 0 : _a.teacher) {
        _push(`<h1 data-v-96d4f91a>${ssrInterpolate(unref(authStore).user.teacher.lastName)} ${ssrInterpolate(unref(authStore).user.teacher.firstName)}</h1>`);
      } else {
        _push(`<!---->`);
      }
      if ((_b = unref(authStore).user) == null ? void 0 : _b.teacher) {
        _push(`<p class="subtitle" data-v-96d4f91a>${ssrInterpolate(unref(authStore).user.teacher.position)} \u2022 ${ssrInterpolate(unref(authStore).user.teacher.department)}</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><button class="logout-button" data-v-96d4f91a>\u0412\u044B\u0439\u0442\u0438</button></header>`);
      if (loading.value) {
        _push(`<div class="loading" data-v-96d4f91a>\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430...</div>`);
      } else if (error.value) {
        _push(`<div class="error" data-v-96d4f91a>${ssrInterpolate(error.value)}</div>`);
      } else {
        _push(`<div class="content" data-v-96d4f91a>`);
        if ((_c = unref(authStore).user) == null ? void 0 : _c.teacher) {
          _push(`<div class="info-card" data-v-96d4f91a><h2 data-v-96d4f91a>\u0418\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u044F \u043E \u043F\u0440\u0435\u043F\u043E\u0434\u0430\u0432\u0430\u0442\u0435\u043B\u0435</h2><div class="info-grid" data-v-96d4f91a><div class="info-item" data-v-96d4f91a><span class="label" data-v-96d4f91a>\u0424\u0418\u041E:</span><span class="value" data-v-96d4f91a>${ssrInterpolate(unref(authStore).user.teacher.lastName)} ${ssrInterpolate(unref(authStore).user.teacher.firstName)} ${ssrInterpolate(unref(authStore).user.teacher.middleName)}</span></div><div class="info-item" data-v-96d4f91a><span class="label" data-v-96d4f91a>\u041A\u0430\u0444\u0435\u0434\u0440\u0430:</span><span class="value" data-v-96d4f91a>${ssrInterpolate(unref(authStore).user.teacher.department)}</span></div><div class="info-item" data-v-96d4f91a><span class="label" data-v-96d4f91a>\u0414\u043E\u043B\u0436\u043D\u043E\u0441\u0442\u044C:</span><span class="value" data-v-96d4f91a>${ssrInterpolate(unref(authStore).user.teacher.position)}</span></div>`);
          if (unref(authStore).user.teacher.academicDegree) {
            _push(`<div class="info-item" data-v-96d4f91a><span class="label" data-v-96d4f91a>\u0423\u0447\u0451\u043D\u0430\u044F \u0441\u0442\u0435\u043F\u0435\u043D\u044C:</span><span class="value" data-v-96d4f91a>${ssrInterpolate(unref(authStore).user.teacher.academicDegree)}</span></div>`);
          } else {
            _push(`<!---->`);
          }
          if (unref(authStore).user.teacher.phone) {
            _push(`<div class="info-item" data-v-96d4f91a><span class="label" data-v-96d4f91a>\u0422\u0435\u043B\u0435\u0444\u043E\u043D:</span><span class="value" data-v-96d4f91a>${ssrInterpolate(unref(authStore).user.teacher.phone)}</span></div>`);
          } else {
            _push(`<!---->`);
          }
          if (unref(authStore).user.teacher.officeNumber) {
            _push(`<div class="info-item" data-v-96d4f91a><span class="label" data-v-96d4f91a>\u041A\u0430\u0431\u0438\u043D\u0435\u0442:</span><span class="value" data-v-96d4f91a>${ssrInterpolate(unref(authStore).user.teacher.officeNumber)}</span></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="subjects-section" data-v-96d4f91a><h2 data-v-96d4f91a>\u041C\u043E\u0438 \u043F\u0440\u0435\u0434\u043C\u0435\u0442\u044B</h2>`);
        if (subjects.value.length === 0) {
          _push(`<div class="empty" data-v-96d4f91a> \u0423 \u0432\u0430\u0441 \u043F\u043E\u043A\u0430 \u043D\u0435\u0442 \u043D\u0430\u0437\u043D\u0430\u0447\u0435\u043D\u043D\u044B\u0445 \u043F\u0440\u0435\u0434\u043C\u0435\u0442\u043E\u0432 </div>`);
        } else {
          _push(`<div class="subjects-grid" data-v-96d4f91a><!--[-->`);
          ssrRenderList(subjects.value, (subject) => {
            _push(`<div class="subject-card" data-v-96d4f91a><div class="subject-header" data-v-96d4f91a><h3 data-v-96d4f91a>${ssrInterpolate(subject.name)}</h3><span class="subject-code" data-v-96d4f91a>${ssrInterpolate(subject.code)}</span></div><div class="subject-details" data-v-96d4f91a><div class="detail-item" data-v-96d4f91a><span class="icon" data-v-96d4f91a>\u{1F4DA}</span><span data-v-96d4f91a>${ssrInterpolate(subject.credits)} \u043A\u0440\u0435\u0434\u0438\u0442\u043E\u0432</span></div><div class="detail-item" data-v-96d4f91a><span class="icon" data-v-96d4f91a>\u{1F4C5}</span><span data-v-96d4f91a>\u0421\u0435\u043C\u0435\u0441\u0442\u0440 ${ssrInterpolate(subject.semester)}</span></div></div>`);
            if (subject.description) {
              _push(`<p class="subject-description" data-v-96d4f91a>${ssrInterpolate(subject.description)}</p>`);
            } else {
              _push(`<!---->`);
            }
            _push(`<button class="view-button" data-v-96d4f91a> \u0423\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u043E\u0446\u0435\u043D\u043A\u0430\u043C\u0438 </button></div>`);
          });
          _push(`<!--]--></div>`);
        }
        _push(`</div><div class="grade-assignment-section" data-v-96d4f91a><h2 data-v-96d4f91a>\u0412\u044B\u0441\u0442\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u043E\u0446\u0435\u043D\u043E\u043A</h2><div class="selection-row" data-v-96d4f91a><div class="selection-group" data-v-96d4f91a><label for="subject-select" data-v-96d4f91a>\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043F\u0440\u0435\u0434\u043C\u0435\u0442:</label><select id="subject-select" class="select-input" data-v-96d4f91a><option${ssrRenderAttr("value", null)} data-v-96d4f91a${ssrIncludeBooleanAttr(Array.isArray(selectedSubjectId.value) ? ssrLooseContain(selectedSubjectId.value, null) : ssrLooseEqual(selectedSubjectId.value, null)) ? " selected" : ""}>-- \u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043F\u0440\u0435\u0434\u043C\u0435\u0442 --</option><!--[-->`);
        ssrRenderList(subjects.value, (subject) => {
          _push(`<option${ssrRenderAttr("value", subject.id)} data-v-96d4f91a${ssrIncludeBooleanAttr(Array.isArray(selectedSubjectId.value) ? ssrLooseContain(selectedSubjectId.value, subject.id) : ssrLooseEqual(selectedSubjectId.value, subject.id)) ? " selected" : ""}>${ssrInterpolate(subject.name)} (${ssrInterpolate(subject.code)}) </option>`);
        });
        _push(`<!--]--></select></div></div>`);
        if (selectedSubjectId.value && groups.value.length > 0) {
          _push(`<div class="selection-row" data-v-96d4f91a><div class="selection-group" data-v-96d4f91a><label for="group-select" data-v-96d4f91a>\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0433\u0440\u0443\u043F\u043F\u0443:</label><select id="group-select" class="select-input" data-v-96d4f91a><option${ssrRenderAttr("value", null)} data-v-96d4f91a${ssrIncludeBooleanAttr(Array.isArray(selectedGroup.value) ? ssrLooseContain(selectedGroup.value, null) : ssrLooseEqual(selectedGroup.value, null)) ? " selected" : ""}>-- \u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0433\u0440\u0443\u043F\u043F\u0443 --</option><!--[-->`);
          ssrRenderList(groups.value, (group) => {
            _push(`<option${ssrRenderAttr("value", group.group)} data-v-96d4f91a${ssrIncludeBooleanAttr(Array.isArray(selectedGroup.value) ? ssrLooseContain(selectedGroup.value, group.group) : ssrLooseEqual(selectedGroup.value, group.group)) ? " selected" : ""}>${ssrInterpolate(group.group)} (${ssrInterpolate(group.studentCount)} \u0441\u0442\u0443\u0434\u0435\u043D\u0442\u043E\u0432) </option>`);
          });
          _push(`<!--]--></select></div></div>`);
        } else {
          _push(`<!---->`);
        }
        if (selectedSubjectId.value && groupsLoading.value) {
          _push(`<div class="loading-small" data-v-96d4f91a> \u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0433\u0440\u0443\u043F\u043F... </div>`);
        } else {
          _push(`<!---->`);
        }
        if (selectedGroup.value && students.value.length > 0) {
          _push(`<div class="students-table-container" data-v-96d4f91a><h3 data-v-96d4f91a>\u0421\u0442\u0443\u0434\u0435\u043D\u0442\u044B \u0433\u0440\u0443\u043F\u043F\u044B ${ssrInterpolate(selectedGroup.value)}</h3>`);
          if (studentsLoading.value) {
            _push(`<div class="loading-small" data-v-96d4f91a> \u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0441\u0442\u0443\u0434\u0435\u043D\u0442\u043E\u0432... </div>`);
          } else {
            _push(`<div class="grades-table" data-v-96d4f91a><table data-v-96d4f91a><thead data-v-96d4f91a><tr data-v-96d4f91a><th data-v-96d4f91a>\u0424\u0418\u041E</th><th data-v-96d4f91a>\u041D\u043E\u043C\u0435\u0440 \u0437\u0430\u0447\u0451\u0442\u043A\u0438</th><th data-v-96d4f91a>\u0422\u0435\u043A\u0443\u0449\u0438\u0435 \u043E\u0446\u0435\u043D\u043A\u0438</th><th data-v-96d4f91a>\u0422\u0438\u043F \u043E\u0446\u0435\u043D\u043A\u0438</th><th data-v-96d4f91a>\u041E\u0446\u0435\u043D\u043A\u0430 (1-10)</th><th data-v-96d4f91a>\u0414\u0430\u0442\u0430</th><th data-v-96d4f91a>\u041F\u0440\u0438\u043C\u0435\u0447\u0430\u043D\u0438\u044F</th></tr></thead><tbody data-v-96d4f91a><!--[-->`);
            ssrRenderList(students.value, (student) => {
              _push(`<tr data-v-96d4f91a><td data-v-96d4f91a>${ssrInterpolate(student.lastName)} ${ssrInterpolate(student.firstName)} ${ssrInterpolate(student.middleName)}</td><td data-v-96d4f91a>${ssrInterpolate(student.studentId)}</td><td data-v-96d4f91a>`);
              if (student.grades && student.grades.length > 0) {
                _push(`<div class="current-grades" data-v-96d4f91a><!--[-->`);
                ssrRenderList(student.grades, (grade) => {
                  _push(`<span class="${ssrRenderClass(["grade-badge", getGradeClass(grade.gradeValue)])}" data-v-96d4f91a>${ssrInterpolate(getGradeTypeLabel(grade.gradeType))}: ${ssrInterpolate(grade.gradeValue)}</span>`);
                });
                _push(`<!--]--></div>`);
              } else {
                _push(`<span class="no-grades" data-v-96d4f91a>\u041D\u0435\u0442 \u043E\u0446\u0435\u043D\u043E\u043A</span>`);
              }
              _push(`</td><td data-v-96d4f91a><select class="table-select" data-v-96d4f91a><option value="" data-v-96d4f91a${ssrIncludeBooleanAttr(Array.isArray(gradesForm.value[student.id].gradeType) ? ssrLooseContain(gradesForm.value[student.id].gradeType, "") : ssrLooseEqual(gradesForm.value[student.id].gradeType, "")) ? " selected" : ""}>-- \u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 --</option><option value="EXAM" data-v-96d4f91a${ssrIncludeBooleanAttr(Array.isArray(gradesForm.value[student.id].gradeType) ? ssrLooseContain(gradesForm.value[student.id].gradeType, "EXAM") : ssrLooseEqual(gradesForm.value[student.id].gradeType, "EXAM")) ? " selected" : ""}>\u042D\u043A\u0437\u0430\u043C\u0435\u043D</option><option value="CREDIT" data-v-96d4f91a${ssrIncludeBooleanAttr(Array.isArray(gradesForm.value[student.id].gradeType) ? ssrLooseContain(gradesForm.value[student.id].gradeType, "CREDIT") : ssrLooseEqual(gradesForm.value[student.id].gradeType, "CREDIT")) ? " selected" : ""}>\u0417\u0430\u0447\u0451\u0442</option><option value="COURSEWORK" data-v-96d4f91a${ssrIncludeBooleanAttr(Array.isArray(gradesForm.value[student.id].gradeType) ? ssrLooseContain(gradesForm.value[student.id].gradeType, "COURSEWORK") : ssrLooseEqual(gradesForm.value[student.id].gradeType, "COURSEWORK")) ? " selected" : ""}>\u041A\u0443\u0440\u0441\u043E\u0432\u0430\u044F</option><option value="TEST" data-v-96d4f91a${ssrIncludeBooleanAttr(Array.isArray(gradesForm.value[student.id].gradeType) ? ssrLooseContain(gradesForm.value[student.id].gradeType, "TEST") : ssrLooseEqual(gradesForm.value[student.id].gradeType, "TEST")) ? " selected" : ""}>\u041A\u043E\u043D\u0442\u0440\u043E\u043B\u044C\u043D\u0430\u044F</option><option value="LAB" data-v-96d4f91a${ssrIncludeBooleanAttr(Array.isArray(gradesForm.value[student.id].gradeType) ? ssrLooseContain(gradesForm.value[student.id].gradeType, "LAB") : ssrLooseEqual(gradesForm.value[student.id].gradeType, "LAB")) ? " selected" : ""}>\u041B\u0430\u0431\u043E\u0440\u0430\u0442\u043E\u0440\u043D\u0430\u044F</option></select></td><td data-v-96d4f91a><input${ssrRenderAttr("value", gradesForm.value[student.id].gradeValue)} type="number" min="1" max="10" class="table-input" placeholder="1-10" data-v-96d4f91a></td><td data-v-96d4f91a><input${ssrRenderAttr("value", gradesForm.value[student.id].examDate)} type="date" class="table-input" data-v-96d4f91a></td><td data-v-96d4f91a><input${ssrRenderAttr("value", gradesForm.value[student.id].notes)} type="text" class="table-input" placeholder="\u041F\u0440\u0438\u043C\u0435\u0447\u0430\u043D\u0438\u044F" data-v-96d4f91a></td></tr>`);
            });
            _push(`<!--]--></tbody></table></div>`);
          }
          _push(`<div class="actions" data-v-96d4f91a><button${ssrIncludeBooleanAttr(isSaving.value || !hasValidGrades.value) ? " disabled" : ""} class="save-button" data-v-96d4f91a>${ssrInterpolate(isSaving.value ? "\u0421\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u0435..." : "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C \u043E\u0446\u0435\u043D\u043A\u0438")}</button><button${ssrIncludeBooleanAttr(isSaving.value) ? " disabled" : ""} class="clear-button" data-v-96d4f91a> \u041E\u0447\u0438\u0441\u0442\u0438\u0442\u044C \u0444\u043E\u0440\u043C\u0443 </button></div>`);
          if (saveSuccess.value) {
            _push(`<div class="success-message" data-v-96d4f91a> \u041E\u0446\u0435\u043D\u043A\u0438 \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u044B! </div>`);
          } else {
            _push(`<!---->`);
          }
          if (saveError.value) {
            _push(`<div class="error-message" data-v-96d4f91a>${ssrInterpolate(saveError.value)}</div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div>`);
        } else if (selectedGroup.value && !studentsLoading.value && students.value.length === 0) {
          _push(`<div class="empty" data-v-96d4f91a> \u0412 \u0432\u044B\u0431\u0440\u0430\u043D\u043D\u043E\u0439 \u0433\u0440\u0443\u043F\u043F\u0435 \u043D\u0435\u0442 \u0441\u0442\u0443\u0434\u0435\u043D\u0442\u043E\u0432 </div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div>`);
      }
      _push(`</div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/teacher.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const teacher = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-96d4f91a"]]);

export { teacher as default };
//# sourceMappingURL=teacher-UOO1Y_0l.mjs.map
