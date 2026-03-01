import { _ as __nuxt_component_0 } from './nuxt-link-CMNdh00k.mjs';
import { defineComponent, ref, mergeProps, withCtx, createTextVNode, createVNode, toDisplayString, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderAttr, ssrInterpolate, ssrRenderList, ssrIncludeBooleanAttr } from 'vue/server-renderer';
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
import 'vue-router';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    const searchQuery = ref("");
    const students = ref([]);
    const loading = ref(false);
    const error = ref("");
    const pagination = ref({
      page: 1,
      limit: 12,
      total: 0,
      totalPages: 0
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "students-page" }, _attrs))} data-v-3789fe1c><div class="container" data-v-3789fe1c><header class="header" data-v-3789fe1c><h1 data-v-3789fe1c>\u041F\u043E\u0438\u0441\u043A \u0441\u0442\u0443\u0434\u0435\u043D\u0442\u043E\u0432</h1>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/",
        class: "back-button"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`\u041D\u0430 \u0433\u043B\u0430\u0432\u043D\u0443\u044E`);
          } else {
            return [
              createTextVNode("\u041D\u0430 \u0433\u043B\u0430\u0432\u043D\u0443\u044E")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</header><div class="search-section" data-v-3789fe1c><input${ssrRenderAttr("value", searchQuery.value)} type="text" placeholder="\u041F\u043E\u0438\u0441\u043A \u043F\u043E \u0424\u0418\u041E \u0438\u043B\u0438 \u043D\u043E\u043C\u0435\u0440\u0443 \u0437\u0430\u0447\u0451\u0442\u043A\u0438..." class="search-input" data-v-3789fe1c></div>`);
      if (loading.value) {
        _push(`<div class="loading" data-v-3789fe1c>\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430...</div>`);
      } else if (error.value) {
        _push(`<div class="error" data-v-3789fe1c>${ssrInterpolate(error.value)}</div>`);
      } else if (students.value.length === 0) {
        _push(`<div class="empty" data-v-3789fe1c> \u0421\u0442\u0443\u0434\u0435\u043D\u0442\u044B \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u044B </div>`);
      } else {
        _push(`<div class="students-grid" data-v-3789fe1c><!--[-->`);
        ssrRenderList(students.value, (student) => {
          _push(ssrRenderComponent(_component_NuxtLink, {
            key: student.id,
            to: `/students/${student.id}`,
            class: "student-card"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              var _a, _b;
              if (_push2) {
                _push2(`<h3 data-v-3789fe1c${_scopeId}>${ssrInterpolate(student.lastName)} ${ssrInterpolate(student.firstName)} ${ssrInterpolate(student.middleName)}</h3><p class="info" data-v-3789fe1c${_scopeId}><strong data-v-3789fe1c${_scopeId}>\u0413\u0440\u0443\u043F\u043F\u0430:</strong> ${ssrInterpolate(((_a = student.group) == null ? void 0 : _a.name) || "-")}</p><p class="info" data-v-3789fe1c${_scopeId}><strong data-v-3789fe1c${_scopeId}>\u0417\u0430\u0447\u0451\u0442\u043A\u0430:</strong> ${ssrInterpolate(student.studentId)}</p>`);
              } else {
                return [
                  createVNode("h3", null, toDisplayString(student.lastName) + " " + toDisplayString(student.firstName) + " " + toDisplayString(student.middleName), 1),
                  createVNode("p", { class: "info" }, [
                    createVNode("strong", null, "\u0413\u0440\u0443\u043F\u043F\u0430:"),
                    createTextVNode(" " + toDisplayString(((_b = student.group) == null ? void 0 : _b.name) || "-"), 1)
                  ]),
                  createVNode("p", { class: "info" }, [
                    createVNode("strong", null, "\u0417\u0430\u0447\u0451\u0442\u043A\u0430:"),
                    createTextVNode(" " + toDisplayString(student.studentId), 1)
                  ])
                ];
              }
            }),
            _: 2
          }, _parent));
        });
        _push(`<!--]--></div>`);
      }
      if (pagination.value.totalPages > 1) {
        _push(`<div class="pagination" data-v-3789fe1c><button${ssrIncludeBooleanAttr(pagination.value.page === 1) ? " disabled" : ""} class="page-btn" data-v-3789fe1c> \u041D\u0430\u0437\u0430\u0434 </button><span class="page-info" data-v-3789fe1c> \u0421\u0442\u0440\u0430\u043D\u0438\u0446\u0430 ${ssrInterpolate(pagination.value.page)} \u0438\u0437 ${ssrInterpolate(pagination.value.totalPages)}</span><button${ssrIncludeBooleanAttr(pagination.value.page === pagination.value.totalPages) ? " disabled" : ""} class="page-btn" data-v-3789fe1c> \u0412\u043F\u0435\u0440\u0451\u0434 </button></div>`);
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/students/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-3789fe1c"]]);

export { index as default };
//# sourceMappingURL=index-DqQ3xxwr.mjs.map
