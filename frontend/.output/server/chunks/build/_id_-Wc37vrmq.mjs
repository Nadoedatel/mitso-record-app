import { _ as __nuxt_component_0 } from './nuxt-link-CMNdh00k.mjs';
import { defineComponent, computed, ref, mergeProps, withCtx, createTextVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderList, ssrRenderClass } from 'vue/server-renderer';
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
  __name: "[id]",
  __ssrInlineRender: true,
  setup(__props) {
    const route = useRoute();
    computed(() => parseInt(route.params.id));
    const student = ref(null);
    const grades = ref([]);
    const loading = ref(true);
    const error = ref("");
    const groupedGrades = computed(() => {
      if (!grades.value) return [];
      const groups = grades.value.reduce((acc, grade) => {
        var _a;
        const semester = ((_a = grade.subject) == null ? void 0 : _a.semester) || 1;
        if (!acc[semester]) {
          acc[semester] = [];
        }
        acc[semester].push(grade);
        return acc;
      }, {});
      return Object.entries(groups).map(([semester, gradesList]) => ({
        semester: parseInt(semester),
        grades: gradesList.sort((a, b) => {
          const dateA = new Date(a.examDate || 0).getTime();
          const dateB = new Date(b.examDate || 0).getTime();
          return dateB - dateA;
        })
      })).sort((a, b) => a.semester - b.semester);
    });
    const formatGradeType = (type) => {
      const types = {
        EXAM: "\u042D\u043A\u0437\u0430\u043C\u0435\u043D",
        CREDIT: "\u0417\u0430\u0447\u0451\u0442",
        COURSEWORK: "\u041A\u0443\u0440\u0441\u043E\u0432\u0430\u044F",
        LAB: "\u041B\u0430\u0431. \u0440\u0430\u0431\u043E\u0442\u0430",
        TEST: "\u0422\u0435\u0441\u0442"
      };
      return types[type] || type;
    };
    const formatDate = (date) => {
      if (!date) return "\u041D/\u0414";
      return new Date(date).toLocaleDateString("ru-RU");
    };
    const getGradeTypeClass = (type) => {
      const classes = {
        EXAM: "type-exam",
        CREDIT: "type-credit",
        COURSEWORK: "type-coursework",
        LAB: "type-lab",
        TEST: "type-test"
      };
      return classes[type] || "";
    };
    const getGradeClass = (value) => {
      if (value >= 90) return "grade-excellent";
      if (value >= 70) return "grade-good";
      if (value >= 50) return "grade-satisfactory";
      return "grade-poor";
    };
    return (_ctx, _push, _parent, _attrs) => {
      var _a;
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "student-detail-page" }, _attrs))} data-v-a528f451><div class="container" data-v-a528f451><header class="header" data-v-a528f451><h1 data-v-a528f451>\u041A\u0430\u0440\u0442\u043E\u0447\u043A\u0430 \u0441\u0442\u0443\u0434\u0435\u043D\u0442\u0430</h1>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/students",
        class: "back-button"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`\u041A \u0441\u043F\u0438\u0441\u043A\u0443`);
          } else {
            return [
              createTextVNode("\u041A \u0441\u043F\u0438\u0441\u043A\u0443")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</header>`);
      if (loading.value) {
        _push(`<div class="loading" data-v-a528f451>\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430...</div>`);
      } else if (error.value) {
        _push(`<div class="error" data-v-a528f451>${ssrInterpolate(error.value)}</div>`);
      } else if (student.value) {
        _push(`<div class="content" data-v-a528f451><div class="student-info" data-v-a528f451><h2 data-v-a528f451>${ssrInterpolate(student.value.lastName)} ${ssrInterpolate(student.value.firstName)} ${ssrInterpolate(student.value.middleName)}</h2><div class="info-grid" data-v-a528f451><div class="info-item" data-v-a528f451><span class="label" data-v-a528f451>\u0413\u0440\u0443\u043F\u043F\u0430:</span><span class="value" data-v-a528f451>${ssrInterpolate(((_a = student.value.group) == null ? void 0 : _a.name) || "-")}</span></div><div class="info-item" data-v-a528f451><span class="label" data-v-a528f451>\u0417\u0430\u0447\u0451\u0442\u043D\u0430\u044F \u043A\u043D\u0438\u0436\u043A\u0430:</span><span class="value" data-v-a528f451>${ssrInterpolate(student.value.studentId)}</span></div><div class="info-item" data-v-a528f451><span class="label" data-v-a528f451>\u041A\u0443\u0440\u0441:</span><span class="value" data-v-a528f451>${ssrInterpolate(student.value.course)}</span></div></div></div><div class="grades-section" data-v-a528f451><h3 data-v-a528f451>\u041E\u0446\u0435\u043D\u043A\u0438</h3>`);
        if (!grades.value || grades.value.length === 0) {
          _push(`<div class="empty" data-v-a528f451> \u041E\u0446\u0435\u043D\u043E\u043A \u043F\u043E\u043A\u0430 \u043D\u0435\u0442 </div>`);
        } else {
          _push(`<div data-v-a528f451><!--[-->`);
          ssrRenderList(groupedGrades.value, (semester) => {
            _push(`<div class="semester-group" data-v-a528f451><h4 data-v-a528f451>\u0421\u0435\u043C\u0435\u0441\u0442\u0440 ${ssrInterpolate(semester.semester)}</h4><div class="grades-table" data-v-a528f451><div class="table-header" data-v-a528f451><div data-v-a528f451>\u041F\u0440\u0435\u0434\u043C\u0435\u0442</div><div data-v-a528f451>\u041F\u0440\u0435\u043F\u043E\u0434\u0430\u0432\u0430\u0442\u0435\u043B\u044C</div><div data-v-a528f451>\u0422\u0438\u043F</div><div data-v-a528f451>\u041E\u0446\u0435\u043D\u043A\u0430</div><div data-v-a528f451>\u0414\u0430\u0442\u0430</div></div><!--[-->`);
            ssrRenderList(semester.grades, (grade) => {
              var _a2, _b;
              _push(`<div class="table-row" data-v-a528f451><div data-v-a528f451>${ssrInterpolate(((_a2 = grade.subject) == null ? void 0 : _a2.name) || "\u041D/\u0414")}</div><div data-v-a528f451>${ssrInterpolate(((_b = grade.subject) == null ? void 0 : _b.teacher) ? `${grade.subject.teacher.lastName} ${grade.subject.teacher.firstName.charAt(0)}.` : "\u041D/\u0414")}</div><div data-v-a528f451><span class="${ssrRenderClass(["grade-type-badge", getGradeTypeClass(grade.gradeType)])}" data-v-a528f451>${ssrInterpolate(formatGradeType(grade.gradeType))}</span></div><div data-v-a528f451><span class="${ssrRenderClass(["grade-value", getGradeClass(grade.gradeValue)])}" data-v-a528f451>${ssrInterpolate(grade.gradeValue)}</span></div><div data-v-a528f451>${ssrInterpolate(formatDate(grade.examDate))}</div></div>`);
            });
            _push(`<!--]--></div></div>`);
          });
          _push(`<!--]--></div>`);
        }
        _push(`</div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/students/[id].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const _id_ = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-a528f451"]]);

export { _id_ as default };
//# sourceMappingURL=_id_-Wc37vrmq.mjs.map
