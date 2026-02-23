import { _ as __nuxt_component_0 } from './nuxt-link-CMNdh00k.mjs';
import { defineComponent, computed, ref, mergeProps, withCtx, createTextVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderAttr, ssrRenderList, ssrRenderClass, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual } from 'vue/server-renderer';
import { useRoute } from 'vue-router';
import { _ as _export_sfc } from './_plugin-vue_export-helper-1tPrXgE0.mjs';
import '../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';
import './server.mjs';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'devalue';
import '@unhead/ssr';
import 'unhead';
import '@unhead/shared';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "grades",
  __ssrInlineRender: true,
  setup(__props) {
    const route = useRoute();
    const subjectId = computed(() => parseInt(route.params.id));
    const subject = ref(null);
    const students = ref([]);
    const grades2 = ref([]);
    const loading = ref(true);
    const error = ref("");
    const searchQuery = ref("");
    const showModal = ref(false);
    const editingGrade = ref(null);
    const selectedStudent = ref(null);
    const saving = ref(false);
    const modalError = ref("");
    const gradeForm = ref({
      studentId: 0,
      subjectId: subjectId.value,
      gradeValue: 0,
      gradeType: "EXAM",
      examDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
    });
    const filteredStudents = computed(() => {
      if (!students.value || students.value.length === 0) return [];
      if (!searchQuery.value) return students.value;
      const query = searchQuery.value.toLowerCase();
      return students.value.filter(
        (s) => `${s.lastName} ${s.firstName} ${s.middleName} ${s.group}`.toLowerCase().includes(query)
      );
    });
    const getStudentGrades = (studentId) => {
      return grades2.value.filter((g) => g.studentId === studentId);
    };
    const formatGradeType = (type) => {
      const types = {
        EXAM: "\u042D\u043A\u0437\u0430\u043C\u0435\u043D",
        CREDIT: "\u0417\u0430\u0447\u0451\u0442",
        COURSEWORK: "\u041A\u0443\u0440\u0441\u043E\u0432\u0430\u044F",
        LAB: "\u041B\u0430\u0431.",
        TEST: "\u0422\u0435\u0441\u0442"
      };
      return types[type] || type;
    };
    const formatDate = (date) => {
      if (!date) return "\u041D/\u0414";
      return new Date(date).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
    };
    const getGradeClass = (value) => {
      if (value >= 90) return "excellent";
      if (value >= 70) return "good";
      if (value >= 50) return "satisfactory";
      return "poor";
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "grades-management-page" }, _attrs))} data-v-08a12a7d><div class="container" data-v-08a12a7d><header class="header" data-v-08a12a7d><div data-v-08a12a7d>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/teacher",
        class: "back-link"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`\u2190 \u041D\u0430\u0437\u0430\u0434 \u043A \u043F\u0440\u0435\u0434\u043C\u0435\u0442\u0430\u043C`);
          } else {
            return [
              createTextVNode("\u2190 \u041D\u0430\u0437\u0430\u0434 \u043A \u043F\u0440\u0435\u0434\u043C\u0435\u0442\u0430\u043C")
            ];
          }
        }),
        _: 1
      }, _parent));
      if (subject.value) {
        _push(`<h1 data-v-08a12a7d>${ssrInterpolate(subject.value.name)}</h1>`);
      } else {
        _push(`<!---->`);
      }
      if (subject.value) {
        _push(`<p class="subtitle" data-v-08a12a7d>\u0423\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u043E\u0446\u0435\u043D\u043A\u0430\u043C\u0438 \u2022 \u0421\u0435\u043C\u0435\u0441\u0442\u0440 ${ssrInterpolate(subject.value.semester)}</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></header>`);
      if (loading.value) {
        _push(`<div class="loading" data-v-08a12a7d>\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430...</div>`);
      } else if (error.value) {
        _push(`<div class="error" data-v-08a12a7d>${ssrInterpolate(error.value)}</div>`);
      } else {
        _push(`<div class="content" data-v-08a12a7d><div class="toolbar" data-v-08a12a7d><input${ssrRenderAttr("value", searchQuery.value)} type="text" placeholder="\u041F\u043E\u0438\u0441\u043A \u0441\u0442\u0443\u0434\u0435\u043D\u0442\u043E\u0432..." class="search-input" data-v-08a12a7d><button class="add-button" data-v-08a12a7d>+ \u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u043E\u0446\u0435\u043D\u043A\u0443</button></div>`);
        if (filteredStudents.value.length === 0) {
          _push(`<div class="empty" data-v-08a12a7d> \u0421\u0442\u0443\u0434\u0435\u043D\u0442\u044B \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u044B </div>`);
        } else {
          _push(`<div class="students-list" data-v-08a12a7d><!--[-->`);
          ssrRenderList(filteredStudents.value, (student) => {
            _push(`<div class="student-card" data-v-08a12a7d><div class="student-info" data-v-08a12a7d><h3 data-v-08a12a7d>${ssrInterpolate(student.lastName)} ${ssrInterpolate(student.firstName)} ${ssrInterpolate(student.middleName)}</h3><p class="student-group" data-v-08a12a7d>\u0413\u0440\u0443\u043F\u043F\u0430: ${ssrInterpolate(student.group)}</p></div><div class="grades-container" data-v-08a12a7d><!--[-->`);
            ssrRenderList(getStudentGrades(student.id), (grade) => {
              _push(`<div class="grade-item" data-v-08a12a7d><span class="${ssrRenderClass(["grade-value", getGradeClass(grade.gradeValue)])}" data-v-08a12a7d>${ssrInterpolate(grade.gradeValue)}</span><span class="grade-type" data-v-08a12a7d>${ssrInterpolate(formatGradeType(grade.gradeType))}</span><span class="grade-date" data-v-08a12a7d>${ssrInterpolate(formatDate(grade.examDate))}</span><div class="grade-actions" data-v-08a12a7d><button class="edit-btn" title="\u0420\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C" data-v-08a12a7d>\u270F\uFE0F</button><button class="delete-btn" title="\u0423\u0434\u0430\u043B\u0438\u0442\u044C" data-v-08a12a7d>\u{1F5D1}\uFE0F</button></div></div>`);
            });
            _push(`<!--]--><button class="add-grade-btn" data-v-08a12a7d> + \u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C </button></div></div>`);
          });
          _push(`<!--]--></div>`);
        }
        _push(`</div>`);
      }
      _push(`</div>`);
      if (showModal.value) {
        _push(`<div class="modal-overlay" data-v-08a12a7d><div class="modal" data-v-08a12a7d><h2 data-v-08a12a7d>${ssrInterpolate(editingGrade.value ? "\u0420\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u043E\u0446\u0435\u043D\u043A\u0443" : "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u043E\u0446\u0435\u043D\u043A\u0443")}</h2><form data-v-08a12a7d>`);
        if (!selectedStudent.value) {
          _push(`<div class="form-group" data-v-08a12a7d><label data-v-08a12a7d>\u0421\u0442\u0443\u0434\u0435\u043D\u0442:</label><select required data-v-08a12a7d><option value="" data-v-08a12a7d${ssrIncludeBooleanAttr(Array.isArray(gradeForm.value.studentId) ? ssrLooseContain(gradeForm.value.studentId, "") : ssrLooseEqual(gradeForm.value.studentId, "")) ? " selected" : ""}>\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0441\u0442\u0443\u0434\u0435\u043D\u0442\u0430</option><!--[-->`);
          ssrRenderList(students.value, (student) => {
            _push(`<option${ssrRenderAttr("value", student.id)} data-v-08a12a7d${ssrIncludeBooleanAttr(Array.isArray(gradeForm.value.studentId) ? ssrLooseContain(gradeForm.value.studentId, student.id) : ssrLooseEqual(gradeForm.value.studentId, student.id)) ? " selected" : ""}>${ssrInterpolate(student.lastName)} ${ssrInterpolate(student.firstName)} (${ssrInterpolate(student.group)}) </option>`);
          });
          _push(`<!--]--></select></div>`);
        } else {
          _push(`<div class="form-group" data-v-08a12a7d><label data-v-08a12a7d>\u0421\u0442\u0443\u0434\u0435\u043D\u0442:</label><p class="selected-student" data-v-08a12a7d>${ssrInterpolate(selectedStudent.value.lastName)} ${ssrInterpolate(selectedStudent.value.firstName)}</p></div>`);
        }
        _push(`<div class="form-group" data-v-08a12a7d><label data-v-08a12a7d>\u041E\u0446\u0435\u043D\u043A\u0430:</label><input${ssrRenderAttr("value", gradeForm.value.gradeValue)} type="number" min="0" max="100" required data-v-08a12a7d></div><div class="form-group" data-v-08a12a7d><label data-v-08a12a7d>\u0422\u0438\u043F:</label><select required data-v-08a12a7d><option value="EXAM" data-v-08a12a7d${ssrIncludeBooleanAttr(Array.isArray(gradeForm.value.gradeType) ? ssrLooseContain(gradeForm.value.gradeType, "EXAM") : ssrLooseEqual(gradeForm.value.gradeType, "EXAM")) ? " selected" : ""}>\u042D\u043A\u0437\u0430\u043C\u0435\u043D</option><option value="CREDIT" data-v-08a12a7d${ssrIncludeBooleanAttr(Array.isArray(gradeForm.value.gradeType) ? ssrLooseContain(gradeForm.value.gradeType, "CREDIT") : ssrLooseEqual(gradeForm.value.gradeType, "CREDIT")) ? " selected" : ""}>\u0417\u0430\u0447\u0451\u0442</option><option value="COURSEWORK" data-v-08a12a7d${ssrIncludeBooleanAttr(Array.isArray(gradeForm.value.gradeType) ? ssrLooseContain(gradeForm.value.gradeType, "COURSEWORK") : ssrLooseEqual(gradeForm.value.gradeType, "COURSEWORK")) ? " selected" : ""}>\u041A\u0443\u0440\u0441\u043E\u0432\u0430\u044F</option><option value="LAB" data-v-08a12a7d${ssrIncludeBooleanAttr(Array.isArray(gradeForm.value.gradeType) ? ssrLooseContain(gradeForm.value.gradeType, "LAB") : ssrLooseEqual(gradeForm.value.gradeType, "LAB")) ? " selected" : ""}>\u041B\u0430\u0431. \u0440\u0430\u0431\u043E\u0442\u0430</option><option value="TEST" data-v-08a12a7d${ssrIncludeBooleanAttr(Array.isArray(gradeForm.value.gradeType) ? ssrLooseContain(gradeForm.value.gradeType, "TEST") : ssrLooseEqual(gradeForm.value.gradeType, "TEST")) ? " selected" : ""}>\u0422\u0435\u0441\u0442</option></select></div><div class="form-group" data-v-08a12a7d><label data-v-08a12a7d>\u0414\u0430\u0442\u0430:</label><input${ssrRenderAttr("value", gradeForm.value.examDate)} type="date" required data-v-08a12a7d></div><div class="modal-actions" data-v-08a12a7d><button type="submit" class="save-btn"${ssrIncludeBooleanAttr(saving.value) ? " disabled" : ""} data-v-08a12a7d>${ssrInterpolate(saving.value ? "\u0421\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u0435..." : "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C")}</button><button type="button" class="cancel-btn" data-v-08a12a7d>\u041E\u0442\u043C\u0435\u043D\u0430</button></div>`);
        if (modalError.value) {
          _push(`<div class="error-message" data-v-08a12a7d>${ssrInterpolate(modalError.value)}</div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</form></div></div>`);
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/subjects/[id]/grades.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const grades = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-08a12a7d"]]);

export { grades as default };
//# sourceMappingURL=grades-D3pbEXM_.mjs.map
