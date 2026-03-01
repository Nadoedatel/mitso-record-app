import { defineComponent, ref, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderList, ssrRenderClass } from 'vue/server-renderer';
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
  __name: "student",
  __ssrInlineRender: true,
  setup(__props) {
    const authStore = useAuthStore();
    useRouter();
    const grades = ref([]);
    const loading = ref(false);
    const error = ref("");
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
    function formatDate(date) {
      if (!date) return "-";
      return new Date(date).toLocaleDateString("ru-RU");
    }
    return (_ctx, _push, _parent, _attrs) => {
      var _a, _b, _c, _d, _e;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "student-page" }, _attrs))} data-v-31b7e67a><div class="container" data-v-31b7e67a><header class="header" data-v-31b7e67a><div data-v-31b7e67a>`);
      if ((_a = unref(authStore).user) == null ? void 0 : _a.student) {
        _push(`<h1 data-v-31b7e67a>${ssrInterpolate(unref(authStore).user.student.lastName)} ${ssrInterpolate(unref(authStore).user.student.firstName)}</h1>`);
      } else {
        _push(`<!---->`);
      }
      if ((_b = unref(authStore).user) == null ? void 0 : _b.student) {
        _push(`<p class="subtitle" data-v-31b7e67a> \u0413\u0440\u0443\u043F\u043F\u0430: ${ssrInterpolate(((_c = unref(authStore).user.student.group) == null ? void 0 : _c.name) || unref(authStore).user.student.group)}</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><button class="logout-button" data-v-31b7e67a>\u0412\u044B\u0439\u0442\u0438</button></header>`);
      if (loading.value) {
        _push(`<div class="loading" data-v-31b7e67a>\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430...</div>`);
      } else if (error.value) {
        _push(`<div class="error" data-v-31b7e67a>${ssrInterpolate(error.value)}</div>`);
      } else {
        _push(`<div class="content" data-v-31b7e67a>`);
        if ((_d = unref(authStore).user) == null ? void 0 : _d.student) {
          _push(`<div class="info-card" data-v-31b7e67a><h2 data-v-31b7e67a>\u0418\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u044F \u043E \u0441\u0442\u0443\u0434\u0435\u043D\u0442\u0435</h2><div class="info-grid" data-v-31b7e67a><div class="info-item" data-v-31b7e67a><span class="label" data-v-31b7e67a>\u0424\u0418\u041E:</span><span class="value" data-v-31b7e67a>${ssrInterpolate(unref(authStore).user.student.lastName)} ${ssrInterpolate(unref(authStore).user.student.firstName)} ${ssrInterpolate(unref(authStore).user.student.middleName)}</span></div><div class="info-item" data-v-31b7e67a><span class="label" data-v-31b7e67a>\u041D\u043E\u043C\u0435\u0440 \u0437\u0430\u0447\u0451\u0442\u043A\u0438:</span><span class="value" data-v-31b7e67a>${ssrInterpolate(unref(authStore).user.student.studentId)}</span></div><div class="info-item" data-v-31b7e67a><span class="label" data-v-31b7e67a>\u0413\u0440\u0443\u043F\u043F\u0430:</span><span class="value" data-v-31b7e67a>${ssrInterpolate(((_e = unref(authStore).user.student.group) == null ? void 0 : _e.name) || unref(authStore).user.student.group)}</span></div><div class="info-item" data-v-31b7e67a><span class="label" data-v-31b7e67a>\u041A\u0443\u0440\u0441:</span><span class="value" data-v-31b7e67a>${ssrInterpolate(unref(authStore).user.student.course)}</span></div></div></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="grades-section" data-v-31b7e67a><h2 data-v-31b7e67a>\u041C\u043E\u0438 \u043E\u0446\u0435\u043D\u043A\u0438</h2>`);
        if (grades.value.length === 0) {
          _push(`<div class="empty" data-v-31b7e67a> \u0423 \u0432\u0430\u0441 \u043F\u043E\u043A\u0430 \u043D\u0435\u0442 \u043E\u0446\u0435\u043D\u043E\u043A </div>`);
        } else {
          _push(`<div class="grades-table" data-v-31b7e67a><table data-v-31b7e67a><thead data-v-31b7e67a><tr data-v-31b7e67a><th data-v-31b7e67a>\u041F\u0440\u0435\u0434\u043C\u0435\u0442</th><th data-v-31b7e67a>\u041F\u0440\u0435\u043F\u043E\u0434\u0430\u0432\u0430\u0442\u0435\u043B\u044C</th><th data-v-31b7e67a>\u0422\u0438\u043F</th><th data-v-31b7e67a>\u041E\u0446\u0435\u043D\u043A\u0430</th><th data-v-31b7e67a>\u0414\u0430\u0442\u0430</th><th data-v-31b7e67a>\u041F\u0440\u0438\u043C\u0435\u0447\u0430\u043D\u0438\u044F</th></tr></thead><tbody data-v-31b7e67a><!--[-->`);
          ssrRenderList(grades.value, (grade) => {
            var _a2, _b2;
            _push(`<tr data-v-31b7e67a><td data-v-31b7e67a>${ssrInterpolate(((_a2 = grade.subject) == null ? void 0 : _a2.name) || "\u041D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D")}</td><td data-v-31b7e67a>${ssrInterpolate(((_b2 = grade.subject) == null ? void 0 : _b2.teacher) ? `${grade.subject.teacher.lastName} ${grade.subject.teacher.firstName.charAt(0)}.` : "\u041D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D")}</td><td data-v-31b7e67a><span class="${ssrRenderClass(["grade-type", `type-${grade.gradeType.toLowerCase()}`])}" data-v-31b7e67a>${ssrInterpolate(getGradeTypeLabel(grade.gradeType))}</span></td><td data-v-31b7e67a><span class="${ssrRenderClass(["grade-value", getGradeClass(grade.gradeValue)])}" data-v-31b7e67a>${ssrInterpolate(grade.gradeValue)}</span></td><td data-v-31b7e67a>${ssrInterpolate(formatDate(grade.examDate))}</td><td data-v-31b7e67a>${ssrInterpolate(grade.notes || "-")}</td></tr>`);
          });
          _push(`<!--]--></tbody></table></div>`);
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/student.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const student = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-31b7e67a"]]);

export { student as default };
//# sourceMappingURL=student-4pJrPNPx.mjs.map
