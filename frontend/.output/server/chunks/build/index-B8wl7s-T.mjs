import { _ as __nuxt_component_0 } from './nuxt-link-CMNdh00k.mjs';
import { defineComponent, ref, mergeProps, withCtx, createTextVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderComponent } from 'vue/server-renderer';
import { useRouter } from 'vue-router';
import { u as useAuthStore } from './useAuth-D7OK4hbw.mjs';
import { u as useHttpClient } from './httpClient-NJZDPBxg.mjs';
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
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    useRouter();
    useHttpClient();
    useAuthStore();
    const user = ref(null);
    const loading = ref(true);
    const error = ref("");
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "home-page" }, _attrs))} data-v-dc80a9d8>`);
      if (loading.value) {
        _push(`<div class="loading" data-v-dc80a9d8>\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430...</div>`);
      } else if (error.value) {
        _push(`<div class="error-container" data-v-dc80a9d8><p class="error" data-v-dc80a9d8>${ssrInterpolate(error.value)}</p><button class="logout-button" data-v-dc80a9d8>\u0412\u044B\u0439\u0442\u0438</button></div>`);
      } else if (user.value) {
        _push(`<div class="container" data-v-dc80a9d8><div class="header" data-v-dc80a9d8><h1 class="title" data-v-dc80a9d8>MITSO Record App</h1><button class="logout-button" data-v-dc80a9d8>\u0412\u044B\u0445\u043E\u0434</button></div><div class="welcome" data-v-dc80a9d8><h2 data-v-dc80a9d8>\u0414\u043E\u0431\u0440\u043E \u043F\u043E\u0436\u0430\u043B\u043E\u0432\u0430\u0442\u044C, ${ssrInterpolate(user.value.email)}!</h2><p class="role-badge" data-v-dc80a9d8>${ssrInterpolate(user.value.role === "TEACHER" ? "\u041F\u0440\u0435\u043F\u043E\u0434\u0430\u0432\u0430\u0442\u0435\u043B\u044C" : "\u0421\u0442\u0443\u0434\u0435\u043D\u0442")}</p></div><div class="navigation" data-v-dc80a9d8><h3 data-v-dc80a9d8>\u041D\u0430\u0432\u0438\u0433\u0430\u0446\u0438\u044F</h3><div class="nav-buttons" data-v-dc80a9d8>`);
        if (user.value.role === "STUDENT") {
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: "/student",
            class: "nav-button"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(` \u041C\u043E\u044F \u0437\u0430\u0447\u0451\u0442\u043D\u0430\u044F \u043A\u043D\u0438\u0436\u043A\u0430 `);
              } else {
                return [
                  createTextVNode(" \u041C\u043E\u044F \u0437\u0430\u0447\u0451\u0442\u043D\u0430\u044F \u043A\u043D\u0438\u0436\u043A\u0430 ")
                ];
              }
            }),
            _: 1
          }, _parent));
        } else {
          _push(`<!---->`);
        }
        if (user.value.role === "TEACHER") {
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: "/teacher",
            class: "nav-button"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(` \u0423\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u043E\u0446\u0435\u043D\u043A\u0430\u043C\u0438 `);
              } else {
                return [
                  createTextVNode(" \u0423\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u043E\u0446\u0435\u043D\u043A\u0430\u043C\u0438 ")
                ];
              }
            }),
            _: 1
          }, _parent));
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div></div>`);
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-dc80a9d8"]]);

export { index as default };
//# sourceMappingURL=index-B8wl7s-T.mjs.map
