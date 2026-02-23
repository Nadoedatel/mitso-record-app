import { defineComponent, ref, mergeProps, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderAttr, ssrIncludeBooleanAttr } from 'vue/server-renderer';
import { useRouter } from 'vue-router';
import { u as useAuthStore } from './useAuth-D7OK4hbw.mjs';
import { u as useHttpClient } from './httpClient-NJZDPBxg.mjs';
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

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "login",
  __ssrInlineRender: true,
  setup(__props) {
    useRouter();
    useHttpClient();
    useAuthStore();
    const email = ref("");
    const password = ref("");
    const loading = ref(false);
    const error = ref("");
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8" }, _attrs))}><div class="max-w-md w-full space-y-8"><div><h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900"> MITSO Record App </h2><p class="mt-2 text-center text-sm text-gray-600"> \u0412\u043E\u0439\u0434\u0438\u0442\u0435 \u0432 \u0441\u0438\u0441\u0442\u0435\u043C\u0443 \u0443\u0447\u0451\u0442\u0430 \u0437\u0430\u0447\u0451\u0442\u043D\u044B\u0445 \u043A\u043D\u0438\u0436\u0435\u043A </p></div><form class="mt-8 space-y-6">`);
      if (error.value) {
        _push(`<div class="rounded-md bg-red-50 p-4"><p class="text-sm text-red-800">${ssrInterpolate(error.value)}</p></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="rounded-md shadow-sm -space-y-px"><div><label for="email" class="sr-only">Email</label><input id="email"${ssrRenderAttr("value", email.value)} name="email" type="email" autocomplete="email" required class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm" placeholder="Email \u0430\u0434\u0440\u0435\u0441"></div><div><label for="password" class="sr-only">\u041F\u0430\u0440\u043E\u043B\u044C</label><input id="password"${ssrRenderAttr("value", password.value)} name="password" type="password" autocomplete="current-password" required class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm" placeholder="\u041F\u0430\u0440\u043E\u043B\u044C"></div></div><div><button type="submit"${ssrIncludeBooleanAttr(loading.value) ? " disabled" : ""} class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed">`);
      if (loading.value) {
        _push(`<span>\u0412\u0445\u043E\u0434...</span>`);
      } else {
        _push(`<span>\u0412\u043E\u0439\u0442\u0438</span>`);
      }
      _push(`</button></div></form></div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/login.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=login-BHHdH37K.mjs.map
