import process from 'node:process';globalThis._importMeta_=globalThis._importMeta_||{url:"file:///_entry.js",env:process.env};import { defineComponent, computed, ref, provide, mergeProps, unref, createVNode, resolveDynamicComponent, withCtx, openBlock, createBlock, Fragment, renderList, hasInjectionContext, inject, toValue, getCurrentInstance, onServerPrefetch, toRef, shallowRef, h, resolveComponent, nextTick, defineAsyncComponent, shallowReactive, Suspense, useSSRContext, createElementBlock, cloneVNode, createApp, withAsyncContext, createTextVNode, toDisplayString, onErrorCaptured, reactive, effectScope, getCurrentScope, isReadonly, isRef, isShallow, isReactive, toRaw } from 'vue';
import { c as createError$1, o as hasProtocol, p as isScriptProtocol, m as joinURL, q as removeResponseHeader, t as setResponseHeader, v as getResponseHeader, w as withQuery, x as sanitizeStatusCode, y as parseURL, z as encodePath, A as decodePath, B as parseQuery, C as getContext, D as withTrailingSlash, E as withoutTrailingSlash, $ as $fetch$1, F as defu, G as createHooks, H as executeAsync } from '../nitro/nitro.mjs';
import { u as useHead$1, h as headSymbol, b as baseURL } from '../routes/renderer.mjs';
import { useRoute as useRoute$1, RouterView, createMemoryHistory, createRouter, START_LOCATION } from 'vue-router';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faArrowRight, faBars, faChevronDown, faEnvelope, faGlobe, faImage, faPhone, faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { ssrRenderAttrs, ssrRenderClass, ssrRenderStyle, ssrRenderComponent, ssrRenderSlot, ssrRenderVNode, ssrRenderList, ssrInterpolate, ssrRenderSuspense } from 'vue/server-renderer';
import { debounce } from 'perfect-debounce';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/utils';
import 'unhead/plugins';

if (!globalThis.$fetch) {
  globalThis.$fetch = $fetch$1.create({
    baseURL: baseURL()
  });
}
if (!("global" in globalThis)) {
  globalThis.global = globalThis;
}
const appLayoutTransition = false;
const nuxtLinkDefaults = { "componentName": "NuxtLink" };
const asyncDataDefaults = { "value": null, "errorValue": null, "deep": true };
const appId = "nuxt-app";
function getNuxtAppCtx(id = appId) {
  return getContext(id, {
    asyncContext: false
  });
}
const NuxtPluginIndicator = "__nuxt_plugin";
function createNuxtApp(options) {
  let hydratingCount = 0;
  const nuxtApp = {
    _id: options.id || appId || "nuxt-app",
    _scope: effectScope(),
    provide: void 0,
    globalName: "nuxt",
    versions: {
      get nuxt() {
        return "3.21.2";
      },
      get vue() {
        return nuxtApp.vueApp.version;
      }
    },
    payload: shallowReactive({
      ...options.ssrContext?.payload || {},
      data: shallowReactive({}),
      state: reactive({}),
      once: /* @__PURE__ */ new Set(),
      _errors: shallowReactive({})
    }),
    static: {
      data: {}
    },
    runWithContext(fn) {
      if (nuxtApp._scope.active && !getCurrentScope()) {
        return nuxtApp._scope.run(() => callWithNuxt(nuxtApp, fn));
      }
      return callWithNuxt(nuxtApp, fn);
    },
    isHydrating: false,
    deferHydration() {
      if (!nuxtApp.isHydrating) {
        return () => {
        };
      }
      hydratingCount++;
      let called = false;
      return () => {
        if (called) {
          return;
        }
        called = true;
        hydratingCount--;
        if (hydratingCount === 0) {
          nuxtApp.isHydrating = false;
          return nuxtApp.callHook("app:suspense:resolve");
        }
      };
    },
    _asyncDataPromises: {},
    _asyncData: shallowReactive({}),
    _payloadRevivers: {},
    ...options
  };
  {
    nuxtApp.payload.serverRendered = true;
  }
  if (nuxtApp.ssrContext) {
    nuxtApp.payload.path = nuxtApp.ssrContext.url;
    nuxtApp.ssrContext.nuxt = nuxtApp;
    nuxtApp.ssrContext.payload = nuxtApp.payload;
    nuxtApp.ssrContext.config = {
      public: nuxtApp.ssrContext.runtimeConfig.public,
      app: nuxtApp.ssrContext.runtimeConfig.app
    };
  }
  nuxtApp.hooks = createHooks();
  nuxtApp.hook = nuxtApp.hooks.hook;
  {
    const contextCaller = async function(hooks, args) {
      for (const hook of hooks) {
        await nuxtApp.runWithContext(() => hook(...args));
      }
    };
    nuxtApp.hooks.callHook = (name, ...args) => nuxtApp.hooks.callHookWith(contextCaller, name, ...args);
  }
  nuxtApp.callHook = nuxtApp.hooks.callHook;
  nuxtApp.provide = (name, value) => {
    const $name = "$" + name;
    defineGetter(nuxtApp, $name, value);
    defineGetter(nuxtApp.vueApp.config.globalProperties, $name, value);
  };
  defineGetter(nuxtApp.vueApp, "$nuxt", nuxtApp);
  defineGetter(nuxtApp.vueApp.config.globalProperties, "$nuxt", nuxtApp);
  const runtimeConfig = options.ssrContext.runtimeConfig;
  nuxtApp.provide("config", runtimeConfig);
  return nuxtApp;
}
function registerPluginHooks(nuxtApp, plugin2) {
  if (plugin2.hooks) {
    nuxtApp.hooks.addHooks(plugin2.hooks);
  }
}
async function applyPlugin(nuxtApp, plugin2) {
  if (typeof plugin2 === "function") {
    const { provide: provide2 } = await nuxtApp.runWithContext(() => plugin2(nuxtApp)) || {};
    if (provide2 && typeof provide2 === "object") {
      for (const key in provide2) {
        nuxtApp.provide(key, provide2[key]);
      }
    }
  }
}
async function applyPlugins(nuxtApp, plugins2) {
  const resolvedPlugins = /* @__PURE__ */ new Set();
  const unresolvedPlugins = [];
  const parallels = [];
  let error = void 0;
  let promiseDepth = 0;
  async function executePlugin(plugin2) {
    const unresolvedPluginsForThisPlugin = plugin2.dependsOn?.filter((name) => plugins2.some((p) => p._name === name) && !resolvedPlugins.has(name)) ?? [];
    if (unresolvedPluginsForThisPlugin.length > 0) {
      unresolvedPlugins.push([new Set(unresolvedPluginsForThisPlugin), plugin2]);
    } else {
      const promise = applyPlugin(nuxtApp, plugin2).then(async () => {
        if (plugin2._name) {
          resolvedPlugins.add(plugin2._name);
          await Promise.all(unresolvedPlugins.map(async ([dependsOn, unexecutedPlugin]) => {
            if (dependsOn.has(plugin2._name)) {
              dependsOn.delete(plugin2._name);
              if (dependsOn.size === 0) {
                promiseDepth++;
                await executePlugin(unexecutedPlugin);
              }
            }
          }));
        }
      }).catch((e) => {
        if (!plugin2.parallel && !nuxtApp.payload.error) {
          throw e;
        }
        error ||= e;
      });
      if (plugin2.parallel) {
        parallels.push(promise);
      } else {
        await promise;
      }
    }
  }
  for (const plugin2 of plugins2) {
    if (nuxtApp.ssrContext?.islandContext && plugin2.env?.islands === false) {
      continue;
    }
    registerPluginHooks(nuxtApp, plugin2);
  }
  for (const plugin2 of plugins2) {
    if (nuxtApp.ssrContext?.islandContext && plugin2.env?.islands === false) {
      continue;
    }
    await executePlugin(plugin2);
  }
  await Promise.all(parallels);
  if (promiseDepth) {
    for (let i = 0; i < promiseDepth; i++) {
      await Promise.all(parallels);
    }
  }
  if (error) {
    throw nuxtApp.payload.error || error;
  }
}
// @__NO_SIDE_EFFECTS__
function defineNuxtPlugin(plugin2) {
  if (typeof plugin2 === "function") {
    return plugin2;
  }
  const _name = plugin2._name || plugin2.name;
  delete plugin2.name;
  return Object.assign(plugin2.setup || (() => {
  }), plugin2, { [NuxtPluginIndicator]: true, _name });
}
function callWithNuxt(nuxt, setup, args) {
  const fn = () => setup();
  const nuxtAppCtx = getNuxtAppCtx(nuxt._id);
  {
    return nuxt.vueApp.runWithContext(() => nuxtAppCtx.callAsync(nuxt, fn));
  }
}
function tryUseNuxtApp(id) {
  let nuxtAppInstance;
  if (hasInjectionContext()) {
    nuxtAppInstance = getCurrentInstance()?.appContext.app.$nuxt;
  }
  nuxtAppInstance ||= getNuxtAppCtx(id).tryUse();
  return nuxtAppInstance || null;
}
function useNuxtApp(id) {
  const nuxtAppInstance = tryUseNuxtApp(id);
  if (!nuxtAppInstance) {
    {
      throw new Error("[nuxt] instance unavailable");
    }
  }
  return nuxtAppInstance;
}
// @__NO_SIDE_EFFECTS__
function useRuntimeConfig(_event) {
  return useNuxtApp().$config;
}
function defineGetter(obj, key, val) {
  Object.defineProperty(obj, key, { get: () => val });
}
const LayoutMetaSymbol = /* @__PURE__ */ Symbol("layout-meta");
const PageRouteSymbol = /* @__PURE__ */ Symbol("route");
globalThis._importMeta_.url.replace(/\/app\/.*$/, "/");
const useRouter = () => {
  return useNuxtApp()?.$router;
};
const useRoute = () => {
  if (hasInjectionContext()) {
    return inject(PageRouteSymbol, useNuxtApp()._route);
  }
  return useNuxtApp()._route;
};
// @__NO_SIDE_EFFECTS__
function defineNuxtRouteMiddleware(middleware) {
  return middleware;
}
const isProcessingMiddleware = () => {
  try {
    if (useNuxtApp()._processingMiddleware) {
      return true;
    }
  } catch {
    return false;
  }
  return false;
};
const URL_QUOTE_RE = /"/g;
const navigateTo = (to, options) => {
  to ||= "/";
  const toPath = typeof to === "string" ? to : "path" in to ? resolveRouteObject(to) : useRouter().resolve(to).href;
  const isExternalHost = hasProtocol(toPath, { acceptRelative: true });
  const isExternal = options?.external || isExternalHost;
  if (isExternal) {
    if (!options?.external) {
      throw new Error("Navigating to an external URL is not allowed by default. Use `navigateTo(url, { external: true })`.");
    }
    const { protocol } = new URL(toPath, "http://localhost");
    if (protocol && isScriptProtocol(protocol)) {
      throw new Error(`Cannot navigate to a URL with '${protocol}' protocol.`);
    }
  }
  const inMiddleware = isProcessingMiddleware();
  const router = useRouter();
  const nuxtApp = useNuxtApp();
  {
    if (nuxtApp.ssrContext) {
      const fullPath = typeof to === "string" || isExternal ? toPath : router.resolve(to).fullPath || "/";
      const location2 = isExternal ? toPath : joinURL((/* @__PURE__ */ useRuntimeConfig()).app.baseURL, fullPath);
      const redirect = async function(response) {
        await nuxtApp.callHook("app:redirected");
        const encodedLoc = location2.replace(URL_QUOTE_RE, "%22");
        const encodedHeader = encodeURL(location2, isExternalHost);
        nuxtApp.ssrContext["~renderResponse"] = {
          statusCode: sanitizeStatusCode(options?.redirectCode || 302, 302),
          body: `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0; url=${encodedLoc}"></head></html>`,
          headers: { location: encodedHeader }
        };
        return response;
      };
      if (!isExternal && inMiddleware) {
        router.afterEach((final) => final.fullPath === fullPath ? redirect(false) : void 0);
        return to;
      }
      return redirect(!inMiddleware ? void 0 : (
        /* abort route navigation */
        false
      ));
    }
  }
  if (isExternal) {
    nuxtApp._scope.stop();
    if (options?.replace) {
      (void 0).replace(toPath);
    } else {
      (void 0).href = toPath;
    }
    if (inMiddleware) {
      if (!nuxtApp.isHydrating) {
        return false;
      }
      return new Promise(() => {
      });
    }
    return Promise.resolve();
  }
  const encodedTo = typeof to === "string" ? encodeRoutePath(to) : to;
  return options?.replace ? router.replace(encodedTo) : router.push(encodedTo);
};
function resolveRouteObject(to) {
  return withQuery(to.path || "", to.query || {}) + (to.hash || "");
}
function encodeURL(location2, isExternalHost = false) {
  const url = new URL(location2, "http://localhost");
  if (!isExternalHost) {
    return url.pathname + url.search + url.hash;
  }
  if (location2.startsWith("//")) {
    return url.toString().replace(url.protocol, "");
  }
  return url.toString();
}
function encodeRoutePath(url) {
  const parsed = parseURL(url);
  return encodePath(decodePath(parsed.pathname)) + parsed.search + parsed.hash;
}
const NUXT_ERROR_SIGNATURE = "__nuxt_error";
const useError = /* @__NO_SIDE_EFFECTS__ */ () => toRef(useNuxtApp().payload, "error");
const showError = (error) => {
  const nuxtError = createError(error);
  try {
    const error2 = /* @__PURE__ */ useError();
    if (false) ;
    error2.value ||= nuxtError;
  } catch {
    throw nuxtError;
  }
  return nuxtError;
};
const isNuxtError = (error) => !!error && typeof error === "object" && NUXT_ERROR_SIGNATURE in error;
const createError = (error) => {
  if (typeof error !== "string" && error.statusText) {
    error.message ??= error.statusText;
  }
  const nuxtError = createError$1(error);
  Object.defineProperty(nuxtError, NUXT_ERROR_SIGNATURE, {
    value: true,
    configurable: false,
    writable: false
  });
  Object.defineProperty(nuxtError, "status", {
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    get: () => nuxtError.statusCode,
    configurable: true
  });
  Object.defineProperty(nuxtError, "statusText", {
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    get: () => nuxtError.statusMessage,
    configurable: true
  });
  return nuxtError;
};
const unhead_k2P3m_ZDyjlr2mMYnoDPwavjsDN8hBlk9cFai0bbopU = /* @__PURE__ */ defineNuxtPlugin({
  name: "nuxt:head",
  enforce: "pre",
  setup(nuxtApp) {
    const head = nuxtApp.ssrContext.head;
    nuxtApp.vueApp.use(head);
  }
});
function toArray$1(value) {
  return Array.isArray(value) ? value : [value];
}
const matcher = /* @__PURE__ */ (() => {
  const $0 = { payload: true };
  return (m, p) => {
    let r = [];
    if (p.charCodeAt(p.length - 1) === 47) p = p.slice(0, -1) || "/";
    if (p === "/") {
      r.unshift({ data: $0 });
    } else if (p === "/robots.txt") {
      r.unshift({ data: $0 });
    } else if (p === "/sitemap.xml") {
      r.unshift({ data: $0 });
    }
    let s = p.split("/");
    s.length;
    r.unshift({ data: $0, params: { "_": s.slice(1).join("/") } });
    return r;
  };
})();
const _routeRulesMatcher = (path) => defu({}, ...matcher("", path).map((r) => r.data).reverse());
const routeRulesMatcher$1 = _routeRulesMatcher;
function getRouteRules(arg) {
  const path = typeof arg === "string" ? arg : arg.path;
  try {
    return routeRulesMatcher$1(path);
  } catch (e) {
    console.error("[nuxt] Error matching route rules.", e);
    return {};
  }
}
const __nuxt_page_meta = { layout: false };
const _routes = [
  {
    name: "index",
    path: "/",
    component: () => import('./index-BBmD50SM.mjs')
  },
  {
    name: "slug",
    path: "/:slug(.*)*",
    meta: __nuxt_page_meta || {},
    component: () => import('./_...slug_-BgLMGVzY.mjs')
  }
];
const _wrapInTransition = (props, children) => {
  return { default: () => children.default?.() };
};
const ROUTE_KEY_PARENTHESES_RE = /(:\w+)\([^)]+\)/g;
const ROUTE_KEY_SYMBOLS_RE = /(:\w+)[?+*]/g;
const ROUTE_KEY_NORMAL_RE = /:\w+/g;
function generateRouteKey(route) {
  const source = route?.meta.key ?? route.path.replace(ROUTE_KEY_PARENTHESES_RE, "$1").replace(ROUTE_KEY_SYMBOLS_RE, "$1").replace(ROUTE_KEY_NORMAL_RE, (r) => route.params[r.slice(1)]?.toString() || "");
  return typeof source === "function" ? source(route) : source;
}
function isChangingPage(to, from) {
  if (to === from || from === START_LOCATION) {
    return false;
  }
  if (generateRouteKey(to) !== generateRouteKey(from)) {
    return true;
  }
  const areComponentsSame = to.matched.every(
    (comp, index) => comp.components && comp.components.default === from.matched[index]?.components?.default
  );
  if (areComponentsSame) {
    return false;
  }
  return true;
}
function toArray(value) {
  return Array.isArray(value) ? value : [value];
}
function _mergeTransitionProps(routeProps) {
  const _props = [];
  for (const prop of routeProps) {
    if (!prop) {
      continue;
    }
    _props.push({
      ...prop,
      onAfterLeave: prop.onAfterLeave ? toArray(prop.onAfterLeave) : void 0,
      onBeforeLeave: prop.onBeforeLeave ? toArray(prop.onBeforeLeave) : void 0
    });
  }
  return defu(..._props);
}
const routerOptions0 = {
  scrollBehavior(to, from, savedPosition) {
    const nuxtApp = useNuxtApp();
    const hashScrollBehaviour = useRouter().options?.scrollBehaviorType ?? "auto";
    if (to.path.replace(/\/$/, "") === from.path.replace(/\/$/, "")) {
      if (from.hash && !to.hash) {
        return { left: 0, top: 0 };
      }
      if (to.hash) {
        return { el: to.hash, top: _getHashElementScrollMarginTop(to.hash), behavior: hashScrollBehaviour };
      }
      return false;
    }
    const routeAllowsScrollToTop = typeof to.meta.scrollToTop === "function" ? to.meta.scrollToTop(to, from) : to.meta.scrollToTop;
    if (routeAllowsScrollToTop === false) {
      return false;
    }
    if (from === START_LOCATION) {
      return _calculatePosition(to, from, savedPosition, hashScrollBehaviour);
    }
    return new Promise((resolve) => {
      const doScroll = () => {
        requestAnimationFrame(() => resolve(_calculatePosition(to, from, savedPosition, hashScrollBehaviour)));
      };
      nuxtApp.hooks.hookOnce("page:loading:end", () => {
        const transitionPromise = nuxtApp["~transitionPromise"];
        if (transitionPromise) {
          transitionPromise.then(doScroll);
        } else {
          doScroll();
        }
      });
    });
  }
};
function _getHashElementScrollMarginTop(selector) {
  try {
    const elem = (void 0).querySelector(selector);
    if (elem) {
      return (Number.parseFloat(getComputedStyle(elem).scrollMarginTop) || 0) + (Number.parseFloat(getComputedStyle((void 0).documentElement).scrollPaddingTop) || 0);
    }
  } catch {
  }
  return 0;
}
function _calculatePosition(to, from, savedPosition, defaultHashScrollBehaviour) {
  if (savedPosition) {
    return savedPosition;
  }
  const isPageNavigation = isChangingPage(to, from);
  if (to.hash) {
    return {
      el: to.hash,
      top: _getHashElementScrollMarginTop(to.hash),
      behavior: isPageNavigation ? defaultHashScrollBehaviour : "instant"
    };
  }
  return {
    left: 0,
    top: 0
  };
}
const configRouterOptions = {
  hashMode: false,
  scrollBehaviorType: "auto"
};
const routerOptions = {
  ...configRouterOptions,
  ...routerOptions0
};
const validate = /* @__PURE__ */ defineNuxtRouteMiddleware(async (to, from) => {
  let __temp, __restore;
  if (!to.meta?.validate) {
    return;
  }
  const result = ([__temp, __restore] = executeAsync(() => Promise.resolve(to.meta.validate(to))), __temp = await __temp, __restore(), __temp);
  if (result === true) {
    return;
  }
  const error = createError({
    fatal: false,
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    status: result && (result.status || result.statusCode) || 404,
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    statusText: result && (result.statusText || result.statusMessage) || `Page Not Found: ${to.fullPath}`,
    data: {
      path: to.fullPath
    }
  });
  return error;
});
const manifest_45route_45rule = /* @__PURE__ */ defineNuxtRouteMiddleware((to) => {
  {
    return;
  }
});
const globalMiddleware = [
  validate,
  manifest_45route_45rule
];
const namedMiddleware = {};
const plugin = /* @__PURE__ */ defineNuxtPlugin({
  name: "nuxt:router",
  enforce: "pre",
  async setup(nuxtApp) {
    let __temp, __restore;
    let routerBase = (/* @__PURE__ */ useRuntimeConfig()).app.baseURL;
    const history = routerOptions.history?.(routerBase) ?? createMemoryHistory(routerBase);
    const routes = routerOptions.routes ? ([__temp, __restore] = executeAsync(() => routerOptions.routes(_routes)), __temp = await __temp, __restore(), __temp) ?? _routes : _routes;
    let startPosition;
    const router = createRouter({
      ...routerOptions,
      scrollBehavior: (to, from, savedPosition) => {
        if (from === START_LOCATION) {
          startPosition = savedPosition;
          return;
        }
        if (routerOptions.scrollBehavior) {
          router.options.scrollBehavior = routerOptions.scrollBehavior;
          if ("scrollRestoration" in (void 0).history) {
            const unsub = router.beforeEach(() => {
              unsub();
              (void 0).history.scrollRestoration = "manual";
            });
          }
          return routerOptions.scrollBehavior(to, START_LOCATION, startPosition || savedPosition);
        }
      },
      history,
      routes
    });
    nuxtApp.vueApp.use(router);
    const previousRoute = shallowRef(router.currentRoute.value);
    router.afterEach((_to, from) => {
      previousRoute.value = from;
    });
    Object.defineProperty(nuxtApp.vueApp.config.globalProperties, "previousRoute", {
      get: () => previousRoute.value
    });
    const initialURL = nuxtApp.ssrContext.url;
    const _route = shallowRef(router.currentRoute.value);
    const syncCurrentRoute = () => {
      _route.value = router.currentRoute.value;
    };
    router.afterEach((to, from) => {
      if (to.matched.at(-1)?.components?.default === from.matched.at(-1)?.components?.default) {
        syncCurrentRoute();
      }
    });
    const route = { sync: syncCurrentRoute };
    for (const key in _route.value) {
      Object.defineProperty(route, key, {
        get: () => _route.value[key],
        enumerable: true
      });
    }
    nuxtApp._route = shallowReactive(route);
    nuxtApp._middleware ||= {
      global: [],
      named: {}
    };
    const error = /* @__PURE__ */ useError();
    if (!nuxtApp.ssrContext?.islandContext) {
      router.afterEach(async (to, _from, failure) => {
        delete nuxtApp._processingMiddleware;
        if (failure) {
          await nuxtApp.callHook("page:loading:end");
        }
        if (failure?.type === 4) {
          return;
        }
        if (to.redirectedFrom && to.fullPath !== initialURL) {
          await nuxtApp.runWithContext(() => navigateTo(to.fullPath || "/"));
        }
      });
    }
    try {
      if (true) {
        ;
        [__temp, __restore] = executeAsync(() => router.push(initialURL)), await __temp, __restore();
        ;
      }
      ;
      [__temp, __restore] = executeAsync(() => router.isReady()), await __temp, __restore();
      ;
    } catch (error2) {
      [__temp, __restore] = executeAsync(() => nuxtApp.runWithContext(() => showError(error2))), await __temp, __restore();
    }
    const resolvedInitialRoute = router.currentRoute.value;
    const hasDeferredRoute = false;
    syncCurrentRoute();
    if (nuxtApp.ssrContext?.islandContext) {
      return { provide: { router } };
    }
    const initialLayout = nuxtApp.payload.state._layout;
    router.beforeEach(async (to, from) => {
      await nuxtApp.callHook("page:loading:start");
      to.meta = reactive(to.meta);
      if (nuxtApp.isHydrating && initialLayout && !isReadonly(to.meta.layout)) {
        to.meta.layout = initialLayout;
      }
      nuxtApp._processingMiddleware = true;
      if (!nuxtApp.ssrContext?.islandContext) {
        const middlewareEntries = /* @__PURE__ */ new Set([...globalMiddleware, ...nuxtApp._middleware.global]);
        for (const component of to.matched) {
          const componentMiddleware = component.meta.middleware;
          if (!componentMiddleware) {
            continue;
          }
          for (const entry2 of toArray$1(componentMiddleware)) {
            middlewareEntries.add(entry2);
          }
        }
        const routeRules = getRouteRules({ path: to.path });
        if (routeRules.appMiddleware) {
          for (const key in routeRules.appMiddleware) {
            if (routeRules.appMiddleware[key]) {
              middlewareEntries.add(key);
            } else {
              middlewareEntries.delete(key);
            }
          }
        }
        for (const entry2 of middlewareEntries) {
          const middleware = typeof entry2 === "string" ? nuxtApp._middleware.named[entry2] || await namedMiddleware[entry2]?.().then((r) => r.default || r) : entry2;
          if (!middleware) {
            throw new Error(`Unknown route middleware: '${entry2}'.`);
          }
          try {
            if (false) ;
            const result = await nuxtApp.runWithContext(() => middleware(to, from));
            if (true) {
              if (result === false || result instanceof Error) {
                const error2 = result || createError({
                  status: 404,
                  statusText: `Page Not Found: ${initialURL}`
                });
                await nuxtApp.runWithContext(() => showError(error2));
                return false;
              }
            }
            if (result === true) {
              continue;
            }
            if (result === false) {
              return result;
            }
            if (result) {
              if (isNuxtError(result) && result.fatal) {
                await nuxtApp.runWithContext(() => showError(result));
              }
              return result;
            }
          } catch (err) {
            const error2 = createError(err);
            if (error2.fatal) {
              await nuxtApp.runWithContext(() => showError(error2));
            }
            return error2;
          }
        }
      }
    });
    router.onError(async () => {
      delete nuxtApp._processingMiddleware;
      await nuxtApp.callHook("page:loading:end");
    });
    router.afterEach((to) => {
      if (to.matched.length === 0 && !error.value) {
        return nuxtApp.runWithContext(() => showError(createError({
          status: 404,
          fatal: false,
          statusText: `Page not found: ${to.fullPath}`,
          data: {
            path: to.fullPath
          }
        })));
      }
    });
    nuxtApp.hooks.hookOnce("app:created", async () => {
      try {
        if ("name" in resolvedInitialRoute) {
          resolvedInitialRoute.name = void 0;
        }
        if (hasDeferredRoute) ;
        else {
          await router.replace({
            ...resolvedInitialRoute,
            force: true
          });
        }
        router.options.scrollBehavior = routerOptions.scrollBehavior;
      } catch (error2) {
        await nuxtApp.runWithContext(() => showError(error2));
      }
    });
    return { provide: { router } };
  }
});
function injectHead(nuxtApp) {
  const nuxt = nuxtApp || tryUseNuxtApp();
  return nuxt?.ssrContext?.head || nuxt?.runWithContext(() => {
    if (hasInjectionContext()) {
      return inject(headSymbol);
    }
  });
}
function useHead(input, options = {}) {
  const head = injectHead(options.nuxt);
  if (head) {
    return useHead$1(input, { head, ...options });
  }
}
function definePayloadReducer(name, reduce) {
  {
    useNuxtApp().ssrContext["~payloadReducers"][name] = reduce;
  }
}
const reducers = [
  ["NuxtError", (data) => isNuxtError(data) && data.toJSON()],
  ["EmptyShallowRef", (data) => isRef(data) && isShallow(data) && !data.value && (typeof data.value === "bigint" ? "0n" : JSON.stringify(data.value) || "_")],
  ["EmptyRef", (data) => isRef(data) && !data.value && (typeof data.value === "bigint" ? "0n" : JSON.stringify(data.value) || "_")],
  ["ShallowRef", (data) => isRef(data) && isShallow(data) && data.value],
  ["ShallowReactive", (data) => isReactive(data) && isShallow(data) && toRaw(data)],
  ["Ref", (data) => isRef(data) && data.value],
  ["Reactive", (data) => isReactive(data) && toRaw(data)]
];
const revive_payload_server_MVtmlZaQpj6ApFmshWfUWl5PehCebzaBf2NuRMiIbms = /* @__PURE__ */ defineNuxtPlugin({
  name: "nuxt:revive-payload:server",
  setup() {
    for (const [reducer, fn] of reducers) {
      definePayloadReducer(reducer, fn);
    }
  }
});
const components_plugin_z4hgvsiddfKkfXTP6M8M4zG5Cb7sGnDhcryKVM45Di4 = /* @__PURE__ */ defineNuxtPlugin({
  name: "nuxt:global-components"
});
library.add(
  faArrowRight,
  faBars,
  faChevronDown,
  faEnvelope,
  faGlobe,
  faImage,
  faPhone,
  faXmark
);
const fontawesome_Q3IsgyqLBh1UKEylzguvAAGnY_M0M67ZFjQjgD7J1rI = /* @__PURE__ */ defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component("FontAwesomeIcon", FontAwesomeIcon);
});
const plugins = [
  unhead_k2P3m_ZDyjlr2mMYnoDPwavjsDN8hBlk9cFai0bbopU,
  plugin,
  revive_payload_server_MVtmlZaQpj6ApFmshWfUWl5PehCebzaBf2NuRMiIbms,
  components_plugin_z4hgvsiddfKkfXTP6M8M4zG5Cb7sGnDhcryKVM45Di4,
  fontawesome_Q3IsgyqLBh1UKEylzguvAAGnY_M0M67ZFjQjgD7J1rI
];
const layouts = {
  default: defineAsyncComponent(() => import('./default-Bl1NsIo8.mjs').then((m) => m.default || m))
};
const routeRulesMatcher = _routeRulesMatcher;
const LayoutLoader = defineComponent({
  name: "LayoutLoader",
  inheritAttrs: false,
  props: {
    name: String,
    layoutProps: Object
  },
  setup(props, context) {
    return () => h(layouts[props.name], props.layoutProps, context.slots);
  }
});
const nuxtLayoutProps = {
  name: {
    type: [String, Boolean, Object],
    default: null
  },
  fallback: {
    type: [String, Object],
    default: null
  }
};
const __nuxt_component_0$1 = defineComponent({
  name: "NuxtLayout",
  inheritAttrs: false,
  props: nuxtLayoutProps,
  setup(props, context) {
    const nuxtApp = useNuxtApp();
    const injectedRoute = inject(PageRouteSymbol);
    const shouldUseEagerRoute = !injectedRoute || injectedRoute === useRoute();
    const route = shouldUseEagerRoute ? useRoute$1() : injectedRoute;
    const layout = computed(() => {
      let layout2 = unref(props.name) ?? route?.meta.layout ?? routeRulesMatcher(route?.path).appLayout ?? "default";
      if (layout2 && !(layout2 in layouts)) {
        if (props.fallback) {
          layout2 = unref(props.fallback);
        }
      }
      return layout2;
    });
    const layoutRef = shallowRef();
    context.expose({ layoutRef });
    const done = nuxtApp.deferHydration();
    let lastLayout;
    return () => {
      const hasLayout = !!layout.value && layout.value in layouts;
      const hasTransition = hasLayout && !!(route?.meta.layoutTransition ?? appLayoutTransition);
      const transitionProps = hasTransition && _mergeTransitionProps([
        route?.meta.layoutTransition,
        appLayoutTransition,
        {
          onBeforeLeave() {
            nuxtApp["~transitionPromise"] = new Promise((resolve) => {
              nuxtApp["~transitionFinish"] = resolve;
            });
          },
          onAfterLeave() {
            nuxtApp["~transitionFinish"]?.();
            delete nuxtApp["~transitionFinish"];
            delete nuxtApp["~transitionPromise"];
          }
        }
      ]);
      const previouslyRenderedLayout = lastLayout;
      lastLayout = layout.value;
      return _wrapInTransition(transitionProps, {
        default: () => h(
          Suspense,
          {
            suspensible: true,
            onResolve: async () => {
              await nextTick(done);
            }
          },
          {
            default: () => h(
              LayoutProvider,
              {
                layoutProps: mergeProps(context.attrs, route.meta.layoutProps ?? {}, { ref: layoutRef }),
                key: layout.value || void 0,
                name: layout.value,
                shouldProvide: !props.name,
                isRenderingNewLayout: (name) => {
                  return name !== previouslyRenderedLayout && name === layout.value;
                },
                hasTransition
              },
              context.slots
            )
          }
        )
      }).default();
    };
  }
});
const LayoutProvider = defineComponent({
  name: "NuxtLayoutProvider",
  inheritAttrs: false,
  props: {
    name: {
      type: [String, Boolean]
    },
    layoutProps: {
      type: Object
    },
    hasTransition: {
      type: Boolean
    },
    shouldProvide: {
      type: Boolean
    },
    isRenderingNewLayout: {
      type: Function,
      required: true
    }
  },
  setup(props, context) {
    const name = props.name;
    if (props.shouldProvide) {
      provide(LayoutMetaSymbol, {
        // When name=false, always return true so NuxtPage doesn't skip rendering
        isCurrent: (route) => name === false || name === (route.meta.layout ?? routeRulesMatcher(route.path).appLayout ?? "default")
      });
    }
    const injectedRoute = inject(PageRouteSymbol);
    const isNotWithinNuxtPage = injectedRoute && injectedRoute === useRoute();
    if (isNotWithinNuxtPage) {
      const vueRouterRoute = useRoute$1();
      const reactiveChildRoute = {};
      for (const _key in vueRouterRoute) {
        const key = _key;
        Object.defineProperty(reactiveChildRoute, key, {
          enumerable: true,
          get: () => {
            return props.isRenderingNewLayout(props.name) ? vueRouterRoute[key] : injectedRoute[key];
          }
        });
      }
      provide(PageRouteSymbol, shallowReactive(reactiveChildRoute));
    }
    return () => {
      if (!name || typeof name === "string" && !(name in layouts)) {
        return context.slots.default?.();
      }
      return h(
        LayoutLoader,
        { key: name, layoutProps: props.layoutProps, name },
        context.slots
      );
    };
  }
});
const defineRouteProvider = (name = "RouteProvider") => defineComponent({
  name,
  props: {
    route: {
      type: Object,
      required: true
    },
    vnode: Object,
    vnodeRef: Object,
    renderKey: String,
    trackRootNodes: Boolean
  },
  setup(props) {
    const previousKey = props.renderKey;
    const previousRoute = props.route;
    const route = {};
    for (const key in props.route) {
      Object.defineProperty(route, key, {
        get: () => previousKey === props.renderKey ? props.route[key] : previousRoute[key],
        enumerable: true
      });
    }
    provide(PageRouteSymbol, shallowReactive(route));
    return () => {
      if (!props.vnode) {
        return props.vnode;
      }
      return h(props.vnode, { ref: props.vnodeRef });
    };
  }
});
const RouteProvider = defineRouteProvider();
const __nuxt_component_1 = defineComponent({
  name: "NuxtPage",
  inheritAttrs: false,
  props: {
    name: {
      type: String
    },
    transition: {
      type: [Boolean, Object],
      default: void 0
    },
    keepalive: {
      type: [Boolean, Object],
      default: void 0
    },
    route: {
      type: Object
    },
    pageKey: {
      type: [Function, String],
      default: null
    }
  },
  setup(props, { attrs, slots, expose }) {
    const nuxtApp = useNuxtApp();
    const pageRef = ref();
    inject(PageRouteSymbol, null);
    expose({ pageRef });
    inject(LayoutMetaSymbol, null);
    nuxtApp.deferHydration();
    return () => {
      return h(RouterView, { name: props.name, route: props.route, ...attrs }, {
        default: (routeProps) => {
          return h(Suspense, { suspensible: true }, {
            default() {
              return h(RouteProvider, {
                vnode: slots.default ? normalizeSlot(slots.default, routeProps) : routeProps.Component,
                route: routeProps.route,
                vnodeRef: pageRef
              });
            }
          });
        }
      });
    };
  }
});
function normalizeSlot(slot, data) {
  const slotContent = slot(data);
  return slotContent.length === 1 ? h(slotContent[0]) : h(Fragment, void 0, slotContent);
}
const _export_sfc = (sfc, props) => {
  const target = sfc.__vccOpts || sfc;
  for (const [key, val] of props) {
    target[key] = val;
  }
  return target;
};
const _sfc_main$5 = {};
function _sfc_ssrRender(_ctx, _push, _parent, _attrs) {
  const _component_NuxtLayout = __nuxt_component_0$1;
  const _component_NuxtPage = __nuxt_component_1;
  _push(ssrRenderComponent(_component_NuxtLayout, _attrs, {
    default: withCtx((_, _push2, _parent2, _scopeId) => {
      if (_push2) {
        _push2(ssrRenderComponent(_component_NuxtPage, null, null, _parent2, _scopeId));
      } else {
        return [
          createVNode(_component_NuxtPage)
        ];
      }
    }),
    _: 1
  }, _parent));
}
const _sfc_setup$5 = _sfc_main$5.setup;
_sfc_main$5.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("app.vue");
  return _sfc_setup$5 ? _sfc_setup$5(props, ctx) : void 0;
};
const AppComponent = /* @__PURE__ */ _export_sfc(_sfc_main$5, [["ssrRender", _sfc_ssrRender]]);
const firstNonUndefined = (...args) => args.find((arg) => arg !== void 0);
// @__NO_SIDE_EFFECTS__
function defineNuxtLink(options) {
  const componentName = options.componentName || "NuxtLink";
  function isHashLinkWithoutHashMode(link) {
    return typeof link === "string" && link.startsWith("#");
  }
  function resolveTrailingSlashBehavior(to, resolve, trailingSlash) {
    const effectiveTrailingSlash = trailingSlash ?? options.trailingSlash;
    if (!to || effectiveTrailingSlash !== "append" && effectiveTrailingSlash !== "remove") {
      return to;
    }
    if (typeof to === "string") {
      return applyTrailingSlashBehavior(to, effectiveTrailingSlash);
    }
    const path = "path" in to && to.path !== void 0 ? to.path : resolve(to).path;
    const resolvedPath = {
      ...to,
      name: void 0,
      // named routes would otherwise always override trailing slash behavior
      path: applyTrailingSlashBehavior(path, effectiveTrailingSlash)
    };
    return resolvedPath;
  }
  function useNuxtLink(props) {
    const router = useRouter();
    const config = /* @__PURE__ */ useRuntimeConfig();
    const hasTarget = computed(() => !!unref(props.target) && unref(props.target) !== "_self");
    const isAbsoluteUrl = computed(() => {
      const path = unref(props.to) || unref(props.href) || "";
      return typeof path === "string" && hasProtocol(path, { acceptRelative: true });
    });
    const builtinRouterLink = resolveComponent("RouterLink");
    const useBuiltinLink = builtinRouterLink && typeof builtinRouterLink !== "string" ? builtinRouterLink.useLink : void 0;
    const isExternal = computed(() => {
      if (unref(props.external)) {
        return true;
      }
      const path = unref(props.to) || unref(props.href) || "";
      if (typeof path === "object") {
        return false;
      }
      return path === "" || isAbsoluteUrl.value;
    });
    const to = computed(() => {
      const path = unref(props.to) || unref(props.href) || "";
      if (isExternal.value) {
        return path;
      }
      return resolveTrailingSlashBehavior(path, router.resolve, unref(props.trailingSlash));
    });
    const link = isExternal.value ? void 0 : useBuiltinLink?.({ ...props, to, viewTransition: unref(props.viewTransition) });
    const href = computed(() => {
      const effectiveTrailingSlash = unref(props.trailingSlash) ?? options.trailingSlash;
      if (!to.value || isAbsoluteUrl.value || isHashLinkWithoutHashMode(to.value)) {
        return to.value;
      }
      if (isExternal.value) {
        const path = typeof to.value === "object" && "path" in to.value ? resolveRouteObject(to.value) : to.value;
        const href2 = typeof path === "object" ? router.resolve(path).href : path;
        return applyTrailingSlashBehavior(href2, effectiveTrailingSlash);
      }
      if (typeof to.value === "object") {
        return router.resolve(to.value)?.href ?? null;
      }
      return applyTrailingSlashBehavior(joinURL(config.app.baseURL, to.value), effectiveTrailingSlash);
    });
    return {
      to,
      hasTarget,
      isAbsoluteUrl,
      isExternal,
      //
      href,
      isActive: link?.isActive ?? computed(() => to.value === router.currentRoute.value.path),
      isExactActive: link?.isExactActive ?? computed(() => to.value === router.currentRoute.value.path),
      route: link?.route ?? computed(() => router.resolve(to.value)),
      async navigate(_e) {
        await navigateTo(href.value, { replace: unref(props.replace), external: isExternal.value || hasTarget.value });
      }
    };
  }
  return defineComponent({
    name: componentName,
    props: {
      // Routing
      to: {
        type: [String, Object],
        default: void 0,
        required: false
      },
      href: {
        type: [String, Object],
        default: void 0,
        required: false
      },
      // Attributes
      target: {
        type: String,
        default: void 0,
        required: false
      },
      rel: {
        type: String,
        default: void 0,
        required: false
      },
      noRel: {
        type: Boolean,
        default: void 0,
        required: false
      },
      // Prefetching
      prefetch: {
        type: Boolean,
        default: void 0,
        required: false
      },
      prefetchOn: {
        type: [String, Object],
        default: void 0,
        required: false
      },
      noPrefetch: {
        type: Boolean,
        default: void 0,
        required: false
      },
      // Styling
      activeClass: {
        type: String,
        default: void 0,
        required: false
      },
      exactActiveClass: {
        type: String,
        default: void 0,
        required: false
      },
      prefetchedClass: {
        type: String,
        default: void 0,
        required: false
      },
      // Vue Router's `<RouterLink>` additional props
      replace: {
        type: Boolean,
        default: void 0,
        required: false
      },
      ariaCurrentValue: {
        type: String,
        default: void 0,
        required: false
      },
      // Edge cases handling
      external: {
        type: Boolean,
        default: void 0,
        required: false
      },
      // Slot API
      custom: {
        type: Boolean,
        default: void 0,
        required: false
      },
      // Behavior
      trailingSlash: {
        type: String,
        default: void 0,
        required: false
      }
    },
    useLink: useNuxtLink,
    setup(props, { slots }) {
      const router = useRouter();
      const { to, href, navigate, isExternal, hasTarget, isAbsoluteUrl } = useNuxtLink(props);
      shallowRef(false);
      const el = void 0;
      const elRef = void 0;
      async function prefetch(nuxtApp = useNuxtApp()) {
        {
          return;
        }
      }
      return () => {
        if (!isExternal.value && !hasTarget.value && !isHashLinkWithoutHashMode(to.value)) {
          const routerLinkProps = {
            ref: elRef,
            to: to.value,
            activeClass: props.activeClass || options.activeClass,
            exactActiveClass: props.exactActiveClass || options.exactActiveClass,
            replace: props.replace,
            ariaCurrentValue: props.ariaCurrentValue,
            custom: props.custom
          };
          if (!props.custom) {
            routerLinkProps.rel = props.rel || void 0;
          }
          return h(
            resolveComponent("RouterLink"),
            routerLinkProps,
            slots.default
          );
        }
        const target = props.target || null;
        const rel = firstNonUndefined(
          // converts `""` to `null` to prevent the attribute from being added as empty (`rel=""`)
          props.noRel ? "" : props.rel,
          options.externalRelAttribute,
          /*
          * A fallback rel of `noopener noreferrer` is applied for external links or links that open in a new tab.
          * This solves a reverse tabnapping security flaw in browsers pre-2021 as well as improving privacy.
          */
          isAbsoluteUrl.value || hasTarget.value ? "noopener noreferrer" : ""
        ) || null;
        if (props.custom) {
          if (!slots.default) {
            return null;
          }
          return slots.default({
            href: href.value,
            navigate,
            prefetch,
            get route() {
              if (!href.value) {
                return void 0;
              }
              const url = new URL(href.value, "http://localhost");
              return {
                path: url.pathname,
                fullPath: url.pathname,
                get query() {
                  return parseQuery(url.search);
                },
                hash: url.hash,
                params: {},
                name: void 0,
                matched: [],
                redirectedFrom: void 0,
                meta: {},
                href: href.value
              };
            },
            rel,
            target,
            isExternal: isExternal.value || hasTarget.value,
            isActive: false,
            isExactActive: false
          });
        }
        return h("a", {
          ref: el,
          href: href.value || null,
          // converts `""` to `null` to prevent the attribute from being added as empty (`href=""`)
          rel,
          target,
          onClick: async (event) => {
            if (isExternal.value || hasTarget.value) {
              return;
            }
            event.preventDefault();
            try {
              const encodedHref = encodeRoutePath(href.value);
              return await (props.replace ? router.replace(encodedHref) : router.push(encodedHref));
            } finally {
            }
          }
        }, slots.default?.());
      };
    }
  });
}
const __nuxt_component_0 = /* @__PURE__ */ defineNuxtLink(nuxtLinkDefaults);
function applyTrailingSlashBehavior(to, trailingSlash) {
  const normalizeFn = trailingSlash === "append" ? withTrailingSlash : withoutTrailingSlash;
  const hasProtocolDifferentFromHttp = hasProtocol(to) && !to.startsWith("http");
  if (hasProtocolDifferentFromHttp) {
    return to;
  }
  return normalizeFn(to, true);
}
function isBlockNode(value) {
  return Boolean(value) && typeof value === "object";
}
function extractNodeChildren(value) {
  return Array.isArray(value) ? value.filter(isBlockNode) : [];
}
function getPropsRecord(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  const props = value.props;
  return props && typeof props === "object" && !Array.isArray(props) ? props : null;
}
function normalizeSchemaNodes(schema) {
  if (!schema) {
    return [];
  }
  if (Array.isArray(schema)) {
    return extractNodeChildren(schema);
  }
  if (Array.isArray(schema.elements)) {
    return extractNodeChildren(schema.elements);
  }
  if (Array.isArray(schema.children)) {
    return extractNodeChildren(schema.children);
  }
  const props = getPropsRecord(schema);
  if (Array.isArray(props?.elements)) {
    return extractNodeChildren(props.elements);
  }
  if (Array.isArray(props?.children)) {
    return extractNodeChildren(props.children);
  }
  if (Array.isArray(props?.content)) {
    return extractNodeChildren(props.content);
  }
  return [];
}
function getNodeChildren(node) {
  if (!node) {
    return [];
  }
  if (Array.isArray(node.children)) {
    return node.children.filter(isBlockNode);
  }
  if (Array.isArray(node.elements)) {
    return extractNodeChildren(node.elements);
  }
  if (Array.isArray(node.content)) {
    return extractNodeChildren(node.content);
  }
  const props = getPropsRecord(node);
  if (Array.isArray(props?.children)) {
    return extractNodeChildren(props.children);
  }
  if (Array.isArray(props?.elements)) {
    return extractNodeChildren(props.elements);
  }
  if (Array.isArray(props?.content)) {
    return extractNodeChildren(props.content);
  }
  return [];
}
function getNodeKey(node, index) {
  const key = node.id ?? node._key ?? node.type ?? "block";
  return `${String(key)}:${index}`;
}
function getNodeName$1(node) {
  const name = node?.name;
  return typeof name === "string" ? name : "";
}
function isHeroSectionName(name) {
  return /^hero\b/i.test(name.trim());
}
function findFirstNonBreadcrumbNode(nodes) {
  const index = nodes.findIndex((node) => getNodeName$1(node) !== "Breadcrumb");
  return index === -1 ? null : { node: nodes[index], index };
}
function normalizeBlockType(type) {
  return (type || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}
function normalizeBodySectionNodes(schema) {
  const nodes = normalizeSchemaNodes(schema);
  if (nodes.length === 1) {
    const only = nodes[0];
    const type = normalizeBlockType(only?.type);
    if (type === "body" || getNodeName$1(only) === "Body") {
      const inner = getNodeChildren(only);
      if (inner.length > 0) {
        return inner;
      }
    }
  }
  return nodes;
}
const _sfc_main$4 = /* @__PURE__ */ defineComponent({
  ...{ name: "ElementRenderer" },
  __name: "ElementRenderer",
  __ssrInlineRender: true,
  props: {
    node: {}
  },
  setup(__props) {
    const props = __props;
    const isDev = false;
    const dynamicField = defineAsyncComponent(
      () => import('./DynamicFieldBlock-k2qR3H3W.mjs')
    );
    const registry = {
      header: defineAsyncComponent(() => import('./ContainerBlock-DfPkDbZS.mjs')),
      body: defineAsyncComponent(() => import('./ContainerBlock-DfPkDbZS.mjs')),
      footer: defineAsyncComponent(() => import('./ContainerBlock-DfPkDbZS.mjs')),
      container: defineAsyncComponent(() => import('./ContainerBlock-DfPkDbZS.mjs')),
      "2col": defineAsyncComponent(() => import('./ContainerBlock-DfPkDbZS.mjs')),
      "3col": defineAsyncComponent(() => import('./ContainerBlock-DfPkDbZS.mjs')),
      text: defineAsyncComponent(() => import('./TextBlock-DMgAI3FN.mjs')),
      section: defineAsyncComponent(() => import('./SectionBlock-X6pvt546.mjs')),
      image: defineAsyncComponent(() => import('./ImageBlock-D79Uy-bz.mjs')),
      video: defineAsyncComponent(() => import('./VideoBlock-B34GIrLV.mjs')),
      link: defineAsyncComponent(() => import('./LinkBlock-6_XkW3Ya.mjs')),
      menu: defineAsyncComponent(() => import('./MenuBlock-DKrPDbl-.mjs')),
      hero: defineAsyncComponent(() => import('./HeroBlock-B-qMKfLi.mjs')),
      contactform: defineAsyncComponent(() => import('./ContactFormBlock-Dvsr_jww.mjs')),
      articleslist: defineAsyncComponent(() => import('./CmsListBlock-D_F-2sOk.mjs')),
      eventslist: defineAsyncComponent(() => import('./CmsListBlock-D_F-2sOk.mjs')),
      cmsarchiveheader: defineAsyncComponent(() => import('./CmsArchiveHeaderBlock-lgpa4tVD.mjs')),
      articletitle: dynamicField,
      articlebody: dynamicField,
      articleimage: dynamicField,
      articleexcerpt: dynamicField,
      articledate: dynamicField,
      articleauthor: dynamicField,
      articlecategory: dynamicField,
      articletag: dynamicField,
      archivetitle: dynamicField,
      archivedescription: dynamicField,
      eventtitle: dynamicField,
      eventbody: dynamicField,
      eventimage: dynamicField,
      eventexcerpt: dynamicField,
      eventdate: dynamicField,
      eventlocation: dynamicField
    };
    const component = computed(() => registry[normalizeBlockType(props.node?.type)]);
    const fallbackChildren = computed(() => getNodeChildren(props.node));
    const shouldRenderFallback = computed(() => fallbackChildren.value.length > 0);
    return (_ctx, _push, _parent, _attrs) => {
      const _component_ElementRenderer = resolveComponent("ElementRenderer", true);
      if (unref(component)) {
        ssrRenderVNode(_push, createVNode(resolveDynamicComponent(unref(component)), mergeProps({ node: __props.node }, _attrs), null), _parent);
      } else if (unref(shouldRenderFallback)) {
        _push(`<div${ssrRenderAttrs(mergeProps({
          class: "wt-unknown-block",
          "data-unsupported-block": "true"
        }, _attrs))} data-v-d8856623>`);
        if (unref(isDev)) {
          _push(`<p class="wt-unknown-label" data-v-d8856623> Unsupported content block </p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<!--[-->`);
        ssrRenderList(unref(fallbackChildren), (child, index) => {
          _push(ssrRenderComponent(_component_ElementRenderer, {
            key: unref(getNodeKey)(child, index),
            node: child
          }, null, _parent));
        });
        _push(`<!--]--></div>`);
      } else {
        _push(`<!---->`);
      }
    };
  }
});
const _sfc_setup$4 = _sfc_main$4.setup;
_sfc_main$4.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/renderer/ElementRenderer.vue");
  return _sfc_setup$4 ? _sfc_setup$4(props, ctx) : void 0;
};
const ElementRenderer = /* @__PURE__ */ _export_sfc(_sfc_main$4, [["__scopeId", "data-v-d8856623"]]);
const HERO_FULL_MIN_HEIGHT = "min(100dvh, 900px)";
const HERO_BANDED_MIN_HEIGHT = "460px";
const _sfc_main$3 = /* @__PURE__ */ defineComponent({
  __name: "SchemaRenderer",
  __ssrInlineRender: true,
  props: {
    schema: {},
    scope: {},
    as: { default: "div" },
    overlaySpacerPaddingTop: {},
    globalHeroMinHeight: {}
  },
  setup(__props) {
    const props = __props;
    const nodes = computed(() => normalizeSchemaNodes(props.schema));
    const isHeroHeightFull = (nodeStyles, globalHeroMinHeight) => {
      const heightValue = typeof nodeStyles?.height === "string" ? nodeStyles.height.trim() : "";
      if (/^-?\d*\.?\d+px$/.test(heightValue)) return false;
      const minHeight = typeof nodeStyles?.minHeight === "string" ? nodeStyles.minHeight.trim() : "";
      if (minHeight === HERO_FULL_MIN_HEIGHT) return true;
      if (minHeight === HERO_BANDED_MIN_HEIGHT) return false;
      if (minHeight.startsWith("var(--builder-hero-min-height")) {
        return !globalHeroMinHeight;
      }
      return false;
    };
    const growLengthByLength = (value, extraLength) => {
      if (typeof value === "number") return `calc(${value}px + ${extraLength})`;
      if (typeof value === "string" && value.trim().length > 0) {
        return `calc(${value.trim()} + ${extraLength})`;
      }
      return void 0;
    };
    const renderNodes = computed(() => {
      if (!props.overlaySpacerPaddingTop) return nodes.value;
      const target = findFirstNonBreadcrumbNode(nodes.value);
      if (!target) return nodes.value;
      return nodes.value.map((node, index) => {
        if (index !== target.index) return node;
        const existingStyles = node.styles;
        const overlaySpacerPaddingTop = props.overlaySpacerPaddingTop;
        if (isHeroHeightFull(existingStyles, props.globalHeroMinHeight)) {
          return {
            ...node,
            styles: { ...existingStyles, justifyContent: "center" }
          };
        }
        const heightGrowth = `calc((${overlaySpacerPaddingTop}) * 2)`;
        return {
          ...node,
          styles: {
            ...existingStyles,
            justifyContent: "center",
            height: growLengthByLength(existingStyles?.height, heightGrowth) ?? existingStyles?.height,
            minHeight: growLengthByLength(existingStyles?.minHeight, heightGrowth) ?? existingStyles?.minHeight
          }
        };
      });
    });
    return (_ctx, _push, _parent, _attrs) => {
      if (unref(renderNodes).length) {
        ssrRenderVNode(_push, createVNode(resolveDynamicComponent(__props.as), mergeProps({
          class: "wt-schema-renderer",
          "data-scope": __props.scope
        }, _attrs), {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<!--[-->`);
              ssrRenderList(unref(renderNodes), (node, index) => {
                _push2(ssrRenderComponent(ElementRenderer, {
                  key: unref(getNodeKey)(node, index),
                  node
                }, null, _parent2, _scopeId));
              });
              _push2(`<!--]-->`);
            } else {
              return [
                (openBlock(true), createBlock(Fragment, null, renderList(unref(renderNodes), (node, index) => {
                  return openBlock(), createBlock(ElementRenderer, {
                    key: unref(getNodeKey)(node, index),
                    node
                  }, null, 8, ["node"]);
                }), 128))
              ];
            }
          }),
          _: 1
        }), _parent);
      } else {
        _push(`<!---->`);
      }
    };
  }
});
const _sfc_setup$3 = _sfc_main$3.setup;
_sfc_main$3.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/renderer/SchemaRenderer.vue");
  return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
const runtimeMenusKey = /* @__PURE__ */ Symbol("runtime-menus");
const runtimeHeaderSchemaKey = /* @__PURE__ */ Symbol("runtime-header-schema");
const runtimeHeaderOverlayKey = /* @__PURE__ */ Symbol("runtime-header-overlay");
const runtimeHeaderShrinkKey = /* @__PURE__ */ Symbol("runtime-header-shrink");
const runtimeBuilderStylesKey = /* @__PURE__ */ Symbol("runtime-builder-styles");
function asRecord$1(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : null;
}
function isRuntimeStyleValue$1(value) {
  return typeof value === "string" || typeof value === "number";
}
function getNodeContent(node) {
  const record = asRecord$1(node);
  if (record?.content !== void 0) {
    return record.content;
  }
  return getNodePropsRecord(node)?.content;
}
function getNodeContentRecord(node) {
  return asRecord$1(getNodeContent(node));
}
function getNodePropsRecord(node) {
  return asRecord$1(asRecord$1(node)?.props);
}
function getNodeStyles(node) {
  const record = asRecord$1(node);
  const styles = asRecord$1(record?.styles ?? getNodePropsRecord(node)?.styles);
  if (!styles) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(styles).filter(([, value]) => isRuntimeStyleValue$1(value))
  );
}
function getNodeClasses(node) {
  const record = asRecord$1(node);
  const value = record?.classes ?? getNodePropsRecord(node)?.classes;
  return typeof value === "string" ? value.trim() : "";
}
function getNodeField(node, key) {
  const record = asRecord$1(node);
  if (record && record[key] !== void 0) {
    return record[key];
  }
  const props = getNodePropsRecord(node);
  if (props && props[key] !== void 0) {
    return props[key];
  }
  const content = getNodeContentRecord(node);
  return content ? content[key] : void 0;
}
function getStringField(node, ...keys) {
  for (const key of keys) {
    const value = getNodeField(node, key);
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return null;
}
function getBooleanField(node, ...keys) {
  for (const key of keys) {
    const value = getNodeField(node, key);
    if (typeof value === "boolean") {
      return value;
    }
  }
  return false;
}
function getArrayField(node, ...keys) {
  for (const key of keys) {
    const value = getNodeField(node, key);
    if (Array.isArray(value)) {
      return value;
    }
  }
  return [];
}
function isFirstSectionHeaderOverlaySafe(schema) {
  const nodes = normalizeBodySectionNodes(schema);
  const first = findFirstNonBreadcrumbNode(nodes)?.node;
  return Boolean(first) && getNodeField(first, "headerOverlaySafe") === true;
}
const MOBILE_BREAKPOINT_MAX = 767.98;
const TABLET_BREAKPOINT_MIN = 768;
const TABLET_BREAKPOINT_MAX = 1023.98;
const DEVICE_CANVAS_WIDTH = {
  Mobile: 375,
  Tablet: 768
};
const ROOT_TYPES = /* @__PURE__ */ new Set(["body", "header", "footer", "__body", "__header", "__footer"]);
const GENERATED_SECTION_SHELL_NAMES = /* @__PURE__ */ new Set([
  "Hero - Modern Split",
  "About - Story Split",
  "Features - Card Grid",
  "Services - Offer Grid",
  "Testimonials - Quote Grid",
  "CTA - Banner",
  "FAQ - Stacked",
  "Contact - Split Form"
]);
const GENERATED_GRID_NAMES = /* @__PURE__ */ new Set([
  "Hero Columns",
  "About Columns",
  "Feature Grid",
  "Services Grid",
  "Testimonial Grid",
  "Contact Columns"
]);
const GENERATED_CARD_MIN_HEIGHTS = {
  "Feature Card": "240px",
  "Service Card": "256px",
  "Testimonial Card": "248px"
};
const UNITLESS_PROPERTIES = /* @__PURE__ */ new Set([
  "animationIterationCount",
  "aspectRatio",
  "flex",
  "flexGrow",
  "flexShrink",
  "fontWeight",
  "lineClamp",
  "lineHeight",
  "opacity",
  "order",
  "orphans",
  "widows",
  "zIndex",
  "zoom"
]);
function asRecord(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : null;
}
function isRuntimeStyleValue(value) {
  return typeof value === "string" || typeof value === "number";
}
function getResponsiveSource(node) {
  const record = asRecord(node);
  const props = asRecord(record?.props);
  return asRecord(record?.responsiveStyles ?? props?.responsiveStyles);
}
function getDeviceOverrideRecord(node, device) {
  const source = getResponsiveSource(node);
  return asRecord(device === "Mobile" ? source?.mobile : source?.tablet);
}
function getDeviceOverrides(node, device) {
  const source = getDeviceOverrideRecord(node, device);
  if (!source) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(source).filter(([, value]) => isRuntimeStyleValue(value))
  );
}
function parsePixelValue(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value !== "string" || !value.includes("px")) {
    return null;
  }
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}
function hasOwnDefinedValue(record, property) {
  return Boolean(record && record[property] !== void 0);
}
function getNodeType(node) {
  return normalizeBlockType(getStringField(node, "type"));
}
function getNodeName(node) {
  return getStringField(node, "name") || "";
}
function getGeneratedLayoutStyleOverrides(node, device) {
  const nodeName = getNodeName(node);
  if (device === "Mobile") {
    return {};
  }
  if (GENERATED_SECTION_SHELL_NAMES.has(nodeName)) {
    return device === "Desktop" ? { gap: "72px" } : { gap: "28px" };
  }
  if (nodeName === "Section Intro") {
    return device === "Desktop" ? { gap: "24px" } : { gap: "10px" };
  }
  if (GENERATED_GRID_NAMES.has(nodeName)) {
    return device === "Desktop" ? { gap: "48px" } : { gap: "24px" };
  }
  if (nodeName === "About Highlights") {
    return device === "Desktop" ? { gap: "28px" } : { gap: "20px" };
  }
  if (nodeName === "FAQ Stack") {
    return device === "Desktop" ? { gap: "20px" } : { gap: "16px" };
  }
  if (nodeName === "About Highlight") {
    return device === "Desktop" ? { minHeight: "220px" } : { minHeight: "180px" };
  }
  const generatedCardMinHeight = GENERATED_CARD_MIN_HEIGHTS[nodeName];
  if (generatedCardMinHeight) {
    return device === "Desktop" ? { minHeight: generatedCardMinHeight } : {
      minHeight: nodeName === "Feature Card" ? "200px" : nodeName === "Service Card" ? "216px" : "208px"
    };
  }
  return {};
}
function getNodeVariant(node) {
  return (getStringField(node, "variant") || "").trim().toLowerCase();
}
function getNodeSlot(node) {
  return (getStringField(node, "slot") || "").trim().toLowerCase();
}
function getNodeIdValue(node) {
  const record = asRecord(node);
  const rawId = record?.id ?? record?._key;
  if (typeof rawId === "string" && rawId.trim()) {
    return rawId.trim();
  }
  if (typeof rawId === "number" && Number.isFinite(rawId)) {
    return String(rawId);
  }
  return null;
}
function toCssPropertyName(property) {
  if (property.startsWith("--")) {
    return property;
  }
  return property.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
}
function toCssPropertyValue(property, value) {
  if (typeof value === "number") {
    return UNITLESS_PROPERTIES.has(property) ? String(value) : `${value}px`;
  }
  return value.replace(/[\r\n]+/g, " ").trim();
}
function escapeAttributeValue(value) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
function buildCssRule(nodeId, styles) {
  const declarations = Object.entries(styles).filter(([, value]) => isRuntimeStyleValue(value)).map(([property, value]) => {
    const cssValue = toCssPropertyValue(property, value);
    return cssValue ? `${toCssPropertyName(property)}: ${cssValue} !important;` : "";
  }).filter(Boolean).join(" ");
  if (!declarations) {
    return null;
  }
  return `[data-wt-node-id="${escapeAttributeValue(nodeId)}"] { ${declarations} }`;
}
function shallowEqualStyles(a, b) {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) {
    return false;
  }
  return aKeys.every((key) => a[key] === b[key]);
}
function getNodeDomId(node) {
  return getNodeIdValue(node);
}
function getResponsiveNodeStyles(node, device, canvasWidth = DEVICE_CANVAS_WIDTH[device], context = {}) {
  const baseStyles = { ...getNodeStyles(node) };
  const colorMode = (getStringField(node, "colorMode") || "").trim().toLowerCase();
  if (getNodeType(node) === "menu" && colorMode === "auto") {
    delete baseStyles.color;
  }
  let mergedStyles = {
    ...baseStyles,
    ...getDeviceOverrides(node, device)
  };
  const deviceOverrideRecord = getDeviceOverrideRecord(node, device);
  const hasDeviceOverride = (property) => hasOwnDefinedValue(deviceOverrideRecord, property);
  const width = mergedStyles.width;
  const originalWidth = width;
  const widthPx = parsePixelValue(width);
  const leftPx = parsePixelValue(mergedStyles.left);
  const marginLeftPx = parsePixelValue(mergedStyles.marginLeft);
  const type = getNodeType(node);
  const isRootSection = ROOT_TYPES.has(type);
  const hasFixedPixelWidth = widthPx !== null;
  const isImageElement = type === "image";
  const isBrandLogoElement = isImageElement && /brand/i.test(getNodeName(node));
  const parentType = normalizeBlockType(context.parentType || "");
  const isHeaderImage = isImageElement && parentType === "header";
  const siblingTypes = context.siblingTypes || [];
  const scope = context.scope;
  const variant = getNodeVariant(node);
  const slot = getNodeSlot(node);
  const isHeaderRoot = type === "header";
  const isHeaderMenu = type === "menu" && (parentType === "header" || variant.includes("header") || slot === "primary" || slot === "utility");
  const isFooterMenu = type === "menu" && (parentType === "footer" || variant.includes("footer") || slot === "legal" || slot === "footer" || slot === "social");
  const isHeaderLink = type === "link" && parentType === "header";
  const hasMenuSibling = siblingTypes.includes("menu");
  const hasImageSibling = siblingTypes.includes("image");
  const imageContent = getNodeContentRecord(node);
  const hasImageSource = isImageElement && typeof imageContent?.src === "string" && imageContent.src.trim().length > 0;
  if (isImageElement && !isBrandLogoElement && !isHeaderImage && !hasDeviceOverride("width")) {
    mergedStyles.width = "100%";
    if (!hasDeviceOverride("maxWidth")) mergedStyles.maxWidth = "100%";
    if (!hasDeviceOverride("left")) mergedStyles.left = "0";
    if (!hasDeviceOverride("marginLeft")) mergedStyles.marginLeft = "0";
    if (!hasDeviceOverride("right")) mergedStyles.right = "auto";
  }
  if (hasImageSource && !isBrandLogoElement && !isHeaderImage && !hasDeviceOverride("height")) {
    mergedStyles.height = "auto";
    if (!hasDeviceOverride("minHeight")) mergedStyles.minHeight = "0px";
  }
  if (hasFixedPixelWidth && !isRootSection && !isBrandLogoElement && !isHeaderImage) {
    mergedStyles.width = "100%";
    mergedStyles.maxWidth = "100%";
    mergedStyles.left = "0";
    mergedStyles.marginLeft = "0";
    mergedStyles.right = "auto";
  }
  if (typeof width === "string" && width.includes("px")) {
    const widthValue = Number.parseInt(width, 10);
    if (Number.isFinite(widthValue) && widthValue > canvasWidth && hasFixedPixelWidth && isRootSection) {
      mergedStyles.width = "100%";
      mergedStyles.maxWidth = width;
      if (mergedStyles.position === "absolute" || mergedStyles.position === "relative") {
        mergedStyles.left = "0";
        mergedStyles.marginLeft = "0";
        mergedStyles.right = "auto";
      }
    }
  }
  const couldOverflowFromOffsets = hasFixedPixelWidth && isRootSection && (leftPx !== null && leftPx + widthPx > canvasWidth || marginLeftPx !== null && marginLeftPx + widthPx > canvasWidth);
  if (couldOverflowFromOffsets) {
    mergedStyles.width = "100%";
    if (typeof originalWidth === "string" && originalWidth.includes("px")) {
      mergedStyles.maxWidth = originalWidth;
    }
    mergedStyles.left = "0";
    mergedStyles.marginLeft = "0";
    mergedStyles.right = "auto";
  }
  if (mergedStyles.position === "absolute" || mergedStyles.position === "relative") {
    const positionedLeft = parsePixelValue(mergedStyles.left);
    if (positionedLeft !== null && positionedLeft >= canvasWidth - 20) {
      mergedStyles.left = "0";
      mergedStyles.marginLeft = "0";
      mergedStyles.right = "auto";
    }
  }
  if (device === "Mobile" && typeof mergedStyles.fontSize === "string") {
    const fontSize = Number.parseInt(mergedStyles.fontSize, 10);
    if (Number.isFinite(fontSize) && fontSize > 16) {
      mergedStyles.fontSize = `${Math.max(14, fontSize * 0.875)}px`;
    }
  }
  if (device === "Tablet" && typeof mergedStyles.fontSize === "string") {
    const fontSize = Number.parseInt(mergedStyles.fontSize, 10);
    if (Number.isFinite(fontSize) && fontSize > 20) {
      mergedStyles.fontSize = `${Math.max(16, fontSize * 0.9)}px`;
    }
  }
  mergedStyles = {
    ...mergedStyles,
    ...getGeneratedLayoutStyleOverrides(node, device)
  };
  if ((device === "Mobile" || device === "Tablet") && mergedStyles.display === "flex" && (scope === "header" || scope === "footer") && !hasDeviceOverride("flexWrap")) {
    mergedStyles.flexWrap = "wrap";
  }
  if (scope === "footer" && device === "Mobile" && mergedStyles.justifyContent === "space-between" && !hasDeviceOverride("justifyContent")) {
    mergedStyles.justifyContent = "flex-start";
  }
  if (device === "Tablet" && isHeaderRoot && (mergedStyles.display === "flex" || hasImageSibling && hasMenuSibling)) {
    if (!hasDeviceOverride("display")) mergedStyles.display = "flex";
    if (!hasDeviceOverride("flexWrap")) mergedStyles.flexWrap = "wrap";
  }
  if (device === "Tablet" && isHeaderMenu) {
    if (!hasDeviceOverride("width")) mergedStyles.width = "auto";
    if (!hasDeviceOverride("maxWidth")) mergedStyles.maxWidth = "100%";
    if (!hasDeviceOverride("flex")) mergedStyles.flex = "0 0 auto";
    if (!hasDeviceOverride("flexBasis")) mergedStyles.flexBasis = "auto";
    if (!hasDeviceOverride("marginLeft")) mergedStyles.marginLeft = "auto";
    if (!hasDeviceOverride("alignSelf")) mergedStyles.alignSelf = "center";
    if (!hasDeviceOverride("order")) mergedStyles.order = 99;
    if (!hasDeviceOverride("position")) mergedStyles.position = "static";
  }
  if (device === "Mobile" && isHeaderRoot && (mergedStyles.display === "flex" || hasImageSibling && hasMenuSibling)) {
    if (!hasDeviceOverride("display")) mergedStyles.display = "flex";
    if (!hasDeviceOverride("flexWrap")) mergedStyles.flexWrap = "wrap";
  }
  if (device === "Mobile" && isHeaderMenu) {
    if (!hasDeviceOverride("width")) mergedStyles.width = "auto";
    if (!hasDeviceOverride("maxWidth")) mergedStyles.maxWidth = "100%";
    if (!hasDeviceOverride("flex")) mergedStyles.flex = "0 0 auto";
    if (!hasDeviceOverride("flexBasis")) mergedStyles.flexBasis = "auto";
    if (!hasDeviceOverride("marginLeft")) mergedStyles.marginLeft = "auto";
    if (!hasDeviceOverride("alignSelf")) mergedStyles.alignSelf = "center";
    if (!hasDeviceOverride("order")) mergedStyles.order = 99;
    if (!hasDeviceOverride("position")) mergedStyles.position = "static";
  }
  if ((device === "Mobile" || device === "Tablet") && isHeaderImage) {
    if (!hasDeviceOverride("width")) mergedStyles.width = originalWidth ?? "auto";
    if (!hasDeviceOverride("maxWidth")) mergedStyles.maxWidth = "100%";
    if (!hasDeviceOverride("flex")) mergedStyles.flex = "0 0 auto";
    if (!hasDeviceOverride("marginLeft")) mergedStyles.marginLeft = "0";
    if (!hasDeviceOverride("marginRight")) mergedStyles.marginRight = "0";
    if (!hasDeviceOverride("alignSelf")) mergedStyles.alignSelf = "auto";
  }
  if (device === "Mobile" && isHeaderLink) {
    if (!hasDeviceOverride("display")) mergedStyles.display = "none";
  }
  if (device === "Tablet" && isHeaderLink) {
    if (!hasDeviceOverride("display")) mergedStyles.display = "none";
  }
  if (device === "Mobile" && isHeaderMenu && slot === "utility") {
    if (!hasDeviceOverride("display")) mergedStyles.display = "none";
  }
  if (device === "Tablet" && isHeaderMenu && slot === "utility") {
    if (!hasDeviceOverride("display")) mergedStyles.display = "none";
  }
  if (device === "Mobile" && isFooterMenu) {
    if (!hasDeviceOverride("width")) mergedStyles.width = "100%";
    if (!hasDeviceOverride("flexDirection")) mergedStyles.flexDirection = "column";
    if (!hasDeviceOverride("alignItems")) mergedStyles.alignItems = "flex-start";
    if (!hasDeviceOverride("gap")) mergedStyles.gap = "12px";
  }
  if (device === "Mobile" && isImageElement && parentType === "header" && !isBrandLogoElement && !hasDeviceOverride("maxWidth")) {
    mergedStyles.maxWidth = "100%";
  }
  return mergedStyles;
}
function visitSchemaNodes(schema, scope, visitor) {
  const queue = normalizeSchemaNodes(schema).map((node) => ({
    node,
    scope,
    parentType: "",
    siblingTypes: []
  }));
  while (queue.length) {
    const current = queue.shift();
    if (!current) {
      continue;
    }
    visitor(current.node, {
      scope: current.scope,
      parentType: current.parentType,
      siblingTypes: current.siblingTypes
    });
    const children = getNodeChildren(current.node);
    const siblingTypes = children.map((child) => getNodeType(child)).filter(Boolean);
    queue.push(
      ...children.map((child) => ({
        node: child,
        scope: current.scope,
        parentType: getNodeType(current.node),
        siblingTypes
      }))
    );
  }
}
function buildResponsiveStylesheet(payload) {
  const desktopRules = [];
  const tabletRules = [];
  const mobileRules = [];
  for (const [scope, schema] of [
    ["header", payload.headerSchema],
    ["body", payload.bodySchema],
    ["footer", payload.footerSchema]
  ]) {
    visitSchemaNodes(schema, scope, (node, context) => {
      const nodeId = getNodeDomId(node);
      if (!nodeId) {
        return;
      }
      const baseStyles = getNodeStyles(node);
      const desktopStyles = {
        ...baseStyles,
        ...getGeneratedLayoutStyleOverrides(node, "Desktop")
      };
      const tabletStyles = getResponsiveNodeStyles(node, "Tablet", void 0, context);
      const mobileStyles = getResponsiveNodeStyles(node, "Mobile", void 0, context);
      if (!shallowEqualStyles(baseStyles, desktopStyles)) {
        const rule = buildCssRule(nodeId, desktopStyles);
        if (rule) {
          desktopRules.push(rule);
        }
      }
      if (!shallowEqualStyles(baseStyles, tabletStyles)) {
        const rule = buildCssRule(nodeId, tabletStyles);
        if (rule) {
          tabletRules.push(rule);
        }
      }
      if (!shallowEqualStyles(baseStyles, mobileStyles)) {
        const rule = buildCssRule(nodeId, mobileStyles);
        if (rule) {
          mobileRules.push(rule);
        }
      }
    });
  }
  const sections = [];
  if (desktopRules.length) {
    sections.push(
      `@media (min-width: 1024px) {
${desktopRules.join("\n")}
}`
    );
  }
  if (tabletRules.length) {
    sections.push(
      `@media (min-width: ${TABLET_BREAKPOINT_MIN}px) and (max-width: ${TABLET_BREAKPOINT_MAX}px) {
${tabletRules.join("\n")}
}`
    );
  }
  if (mobileRules.length) {
    sections.push(
      `@media (max-width: ${MOBILE_BREAKPOINT_MAX}px) {
${mobileRules.join("\n")}
}`
    );
  }
  return sections.join("\n\n");
}
const DEFAULT_CSS_VARS = {
  "--wt-color-primary": "#2563eb",
  "--wt-color-text": "#111827",
  "--wt-color-bg": "#ffffff",
  "--wt-color-muted": "#6b7280",
  "--wt-font-body": "Inter, Arial, sans-serif",
  "--wt-font-heading": "Inter, Arial, sans-serif"
};
function isStyleRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
function toCssValue(value) {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return null;
}
function toCssLength(value, fallback) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return `${value}px`;
  }
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  return fallback;
}
function normalizeTokenSegment(segment) {
  return segment.replace(/([a-z0-9])([A-Z])/g, "$1-$2").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase();
}
function extractCssVars(source) {
  if (!isStyleRecord(source)) {
    return {};
  }
  const vars = {};
  for (const [key, value] of Object.entries(source)) {
    const cssValue = toCssValue(value);
    if (!key.startsWith("--") || cssValue === null) {
      continue;
    }
    vars[key] = cssValue;
  }
  return vars;
}
function flattenStyleTokens(source, prefix = "--wt", output = {}) {
  for (const [key, value] of Object.entries(source)) {
    if (key.startsWith("--") || key === "cssVars" || key === "variables") {
      continue;
    }
    const tokenName = normalizeTokenSegment(key);
    if (!tokenName) {
      continue;
    }
    const cssValue = toCssValue(value);
    if (cssValue !== null) {
      output[`${prefix}-${tokenName}`] = cssValue;
      continue;
    }
    if (isStyleRecord(value)) {
      flattenStyleTokens(value, `${prefix}-${tokenName}`, output);
    }
  }
  return output;
}
function getNestedStyleValue(source, path) {
  let current = source;
  for (const segment of path) {
    if (!isStyleRecord(current)) {
      return null;
    }
    current = current[segment];
  }
  return toCssValue(current);
}
function buildCssVars(styles) {
  const directVars = {
    ...extractCssVars(styles),
    ...extractCssVars(isStyleRecord(styles?.cssVars) ? styles.cssVars : null),
    ...extractCssVars(isStyleRecord(styles?.variables) ? styles.variables : null)
  };
  const tokenVars = isStyleRecord(styles) ? flattenStyleTokens(styles) : {};
  const primaryColor = getNestedStyleValue(styles, ["colors", "primary"]) || directVars["--wt-color-primary"] || DEFAULT_CSS_VARS["--wt-color-primary"];
  const textColor = getNestedStyleValue(styles, ["colors", "text"]) || directVars["--wt-color-text"] || DEFAULT_CSS_VARS["--wt-color-text"];
  const backgroundColor = getNestedStyleValue(styles, ["colors", "background"]) || directVars["--wt-color-bg"] || DEFAULT_CSS_VARS["--wt-color-bg"];
  const surfaceColor = getNestedStyleValue(styles, ["colors", "surface"]) || directVars["--builder-color-surface"] || "#f8fafc";
  const secondaryColor = getNestedStyleValue(styles, ["colors", "secondary"]) || directVars["--builder-color-secondary"] || "#0f172a";
  const accentColor = getNestedStyleValue(styles, ["colors", "accent"]) || directVars["--builder-color-accent"] || "#f59e0b";
  const mutedColor = getNestedStyleValue(styles, ["colors", "muted"]) || directVars["--wt-color-muted"] || DEFAULT_CSS_VARS["--wt-color-muted"];
  const bodyFont = getNestedStyleValue(styles, ["fonts", "body"]) || getNestedStyleValue(styles, ["typography", "bodyFont"]) || directVars["--wt-font-body"] || DEFAULT_CSS_VARS["--wt-font-body"];
  const headingFont = getNestedStyleValue(styles, ["fonts", "heading"]) || getNestedStyleValue(styles, ["typography", "headingFont"]) || directVars["--wt-font-heading"] || bodyFont;
  const buttonBackground = getNestedStyleValue(styles, ["buttons", "background"]) || primaryColor;
  const buttonText = getNestedStyleValue(styles, ["buttons", "text"]) || "#ffffff";
  const buttonRadius = toCssLength(styles?.buttons && isStyleRecord(styles.buttons) ? styles.buttons.radius : null, "14px");
  const pageBackground = getNestedStyleValue(styles, ["page", "background"]) || backgroundColor;
  const pageMaxWidth = toCssLength(styles?.page && isStyleRecord(styles.page) ? styles.page.maxWidth : null, "1280px");
  const heroMinHeight = getNestedStyleValue(styles, ["hero", "minHeight"]);
  const heroHeadingSize = getNestedStyleValue(styles, ["heroTypography", "headingSize"]);
  const heroBodySize = getNestedStyleValue(styles, ["heroTypography", "bodySize"]);
  return {
    ...DEFAULT_CSS_VARS,
    ...tokenVars,
    ...directVars,
    "--wt-color-primary": primaryColor,
    "--wt-color-text": textColor,
    "--wt-color-bg": backgroundColor,
    "--wt-color-muted": mutedColor,
    "--wt-font-body": bodyFont,
    "--wt-font-heading": headingFont,
    "--builder-color-primary": primaryColor,
    "--builder-color-secondary": secondaryColor,
    "--builder-color-accent": accentColor,
    "--builder-color-text": textColor,
    "--builder-color-background": backgroundColor,
    "--builder-color-surface": surfaceColor,
    "--builder-page-background": pageBackground,
    "--builder-page-max-width": pageMaxWidth,
    "--builder-font-body": bodyFont,
    "--builder-font-heading": headingFont,
    "--builder-button-background": buttonBackground,
    "--builder-button-text": buttonText,
    "--builder-button-radius": buttonRadius,
    ...heroMinHeight ? { "--builder-hero-min-height": heroMinHeight } : {},
    ...heroHeadingSize ? { "--builder-hero-heading-size": heroHeadingSize } : {},
    ...heroBodySize ? { "--builder-hero-body-size": heroBodySize } : {}
  };
}
function useRequestEvent(nuxtApp) {
  nuxtApp ||= useNuxtApp();
  return nuxtApp.ssrContext?.event;
}
function useResponseHeader(header) {
  const event = useRequestEvent();
  return computed({
    get() {
      return getResponseHeader(event, header);
    },
    set(newValue) {
      if (!newValue) {
        return removeResponseHeader(event, header);
      }
      return setResponseHeader(event, header, newValue);
    }
  });
}
function readServerRequestHost() {
  const event = useRequestEvent();
  if (!event) {
    return "";
  }
  const forwardedHost = event.node.req.headers["x-forwarded-host"];
  const host = event.node.req.headers.host;
  return String(
    (Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost) || (Array.isArray(host) ? host[0] : host) || ""
  );
}
function firstForwardedValue(value) {
  return (value || "").split(",")[0]?.trim() || "";
}
function stripOriginDecorators(value) {
  const candidate = value.trim();
  if (!candidate) {
    return "";
  }
  if (candidate.includes("://")) {
    try {
      return new URL(candidate).host;
    } catch {
      return "";
    }
  }
  return candidate.replace(/[/?#].*$/, "");
}
function parseHost(value) {
  const candidate = stripOriginDecorators(firstForwardedValue(value)).toLowerCase().replace(/^\.+|\.+$/g, "");
  if (!candidate) {
    return {
      host: "",
      hostname: "",
      port: ""
    };
  }
  if (candidate.startsWith("[")) {
    const closingBracket = candidate.indexOf("]");
    const hostname2 = closingBracket >= 0 ? candidate.slice(0, closingBracket + 1) : candidate;
    const remainder = closingBracket >= 0 ? candidate.slice(closingBracket + 1) : "";
    const port2 = remainder.startsWith(":") ? remainder.slice(1).replace(/[^\d].*$/, "") : "";
    return {
      host: port2 ? `${hostname2}:${port2}` : hostname2,
      hostname: hostname2,
      port: port2
    };
  }
  const portMatch = candidate.match(/^(.*?)(?::(\d+))?$/);
  const hostname = (portMatch?.[1] || candidate).replace(/^\.+|\.+$/g, "");
  const port = portMatch?.[2] || "";
  return {
    host: hostname ? port ? `${hostname}:${port}` : hostname : "",
    hostname,
    port
  };
}
function isLocalHostname(hostname) {
  return hostname === "localhost" || hostname.endsWith(".localhost");
}
function normalizeHost(value) {
  return parseHost(value).host;
}
function preferRequestHost(candidateHost, requestHost) {
  const candidate = parseHost(candidateHost);
  const request = parseHost(requestHost);
  if (!candidate.host) {
    return request.host;
  }
  if (!request.port) {
    return candidate.host;
  }
  if (!candidate.port && candidate.hostname === request.hostname) {
    return request.host;
  }
  return candidate.host;
}
function isLocalPlatformRequestHost(requestHost, platformBaseDomain) {
  const request = parseHost(requestHost);
  const platformBase = parseHost(platformBaseDomain);
  if (!request.hostname || !platformBase.hostname || !isLocalHostname(platformBase.hostname)) {
    return false;
  }
  if (platformBase.port && request.port && platformBase.port !== request.port) {
    return false;
  }
  const suffix = `.${platformBase.hostname}`;
  if (!request.hostname.endsWith(suffix)) {
    return false;
  }
  const prefix = request.hostname.slice(0, -suffix.length);
  return prefix.length > 0 && !prefix.includes(".");
}
function getRequestHost() {
  {
    return normalizeHost(readServerRequestHost());
  }
}
function mergeVaryHeader(existing, values) {
  const incoming = Array.isArray(values) ? values : [values];
  const merged = /* @__PURE__ */ new Map();
  for (const entry2 of [existing || "", ...incoming]) {
    for (const token of entry2.split(",")) {
      const normalized = token.trim();
      if (!normalized) {
        continue;
      }
      merged.set(normalized.toLowerCase(), normalized);
    }
  }
  return Array.from(merged.values()).join(", ");
}
const DEFAULT_HEADER_SCROLL_REVEAL_OFFSET_PX = 80;
const HEADER_SCROLL_REVEAL_OFFSET_MIN_PX = 0;
const HEADER_SCROLL_REVEAL_OFFSET_MAX_PX = 600;
const DEFAULT_HEADER_SHRINK_OFFSET_PX = 80;
const HEADER_SHRINK_OFFSET_MIN_PX = 0;
const HEADER_SHRINK_OFFSET_MAX_PX = 600;
const HEADER_SHRINK_AMOUNT_MIN_PERCENT = 50;
const HEADER_SHRINK_AMOUNT_MAX_PERCENT = 100;
const DEFAULT_HEADER_SHRINK_AMOUNT_PERCENT = 80;
const HEADER_OVERLAY_SPACER_BUFFER_PX = 32;
const HEADER_OVERLAY_SPACER_FALLBACK_MIN_HEIGHT = "96px";
const _sfc_main$2 = /* @__PURE__ */ defineComponent({
  __name: "PublicSiteShell",
  __ssrInlineRender: true,
  props: {
    entity: {},
    site: {},
    bodySchema: {}
  },
  setup(__props) {
    const props = __props;
    const BACKGROUND_STYLE_KEYS = [
      "background",
      "backgroundColor",
      "backgroundImage",
      "backgroundSize",
      "backgroundPosition",
      "backgroundRepeat",
      "backgroundAttachment",
      "backgroundClip",
      "backgroundOrigin"
    ];
    function pickRootBackgroundStyles(schema) {
      const [root] = normalizeSchemaNodes(schema);
      if (!root) return void 0;
      const styles = getNodeStyles(root);
      const picked = {};
      for (const key of BACKGROUND_STYLE_KEYS) {
        const value = styles[key];
        if (value !== void 0 && value !== "") {
          picked[key] = value;
        }
      }
      return Object.keys(picked).length ? picked : void 0;
    }
    const cssVars = computed(() => buildCssVars(props.site?.builderStyles));
    const runtimeBuilderStyles = computed(() => props.site?.builderStyles);
    const runtimeMenus = computed(() => props.site?.menus ?? []);
    const pageWidthMode = computed(() => {
      const styles = props.site?.builderStyles;
      const page = styles && typeof styles === "object" && !Array.isArray(styles) ? styles.page : null;
      if (!page || typeof page !== "object" || Array.isArray(page)) {
        return "contained";
      }
      return page.widthMode === "full" ? "full" : "contained";
    });
    const runtimeHeaderSchema = computed(() => props.site?.headerSchema);
    const staticHeaderOverlay = computed(() => {
      const headerSchema = props.site?.headerSchema;
      if (!headerSchema || typeof headerSchema !== "object" || Array.isArray(headerSchema)) {
        return false;
      }
      const behavior = "behavior" in headerSchema ? headerSchema.behavior : null;
      return Boolean(
        behavior && typeof behavior === "object" && !Array.isArray(behavior) && "overlay" in behavior && behavior.overlay === true
      );
    });
    const heroIsBackgroundLayout = computed(() => {
      const nodes = normalizeBodySectionNodes(props.bodySchema);
      const first = findFirstNonBreadcrumbNode(nodes)?.node;
      if (!first) return false;
      if (first?.name !== "Hero") return false;
      const styles = getNodeStyles(first);
      const minHeight = styles.minHeight;
      const backgroundImage = styles.backgroundImage;
      return typeof minHeight === "string" && minHeight.includes("--builder-hero-min-height") && typeof backgroundImage === "string" && backgroundImage.includes("linear-gradient");
    });
    function readHeaderBehavior() {
      const headerSchema = props.site?.headerSchema;
      if (!headerSchema || typeof headerSchema !== "object" || Array.isArray(headerSchema)) {
        return null;
      }
      const behavior = "behavior" in headerSchema ? headerSchema.behavior : null;
      return behavior && typeof behavior === "object" && !Array.isArray(behavior) ? behavior : null;
    }
    const headerRevealOnScroll = computed(() => {
      const behavior = readHeaderBehavior();
      return behavior?.revealBackgroundOnScroll !== false;
    });
    const headerRevealOffset = computed(() => {
      const raw = readHeaderBehavior()?.scrollRevealOffset;
      if (typeof raw !== "number" || !Number.isFinite(raw)) {
        return DEFAULT_HEADER_SCROLL_REVEAL_OFFSET_PX;
      }
      return Math.min(
        HEADER_SCROLL_REVEAL_OFFSET_MAX_PX,
        Math.max(HEADER_SCROLL_REVEAL_OFFSET_MIN_PX, Math.round(raw))
      );
    });
    computed(() => readHeaderBehavior()?.shrinkOnScroll === true);
    computed(() => {
      if (wantsHeaderOverlay.value) {
        return headerRevealOffset.value;
      }
      const raw = readHeaderBehavior()?.scrollShrinkOffset;
      if (typeof raw !== "number" || !Number.isFinite(raw)) {
        return DEFAULT_HEADER_SHRINK_OFFSET_PX;
      }
      return Math.min(
        HEADER_SHRINK_OFFSET_MAX_PX,
        Math.max(HEADER_SHRINK_OFFSET_MIN_PX, Math.round(raw))
      );
    });
    const headerShrinkRatio = computed(() => {
      const raw = readHeaderBehavior()?.shrinkAmount;
      const amount = typeof raw === "number" && Number.isFinite(raw) ? Math.min(
        HEADER_SHRINK_AMOUNT_MAX_PERCENT,
        Math.max(HEADER_SHRINK_AMOUNT_MIN_PERCENT, Math.round(raw))
      ) : DEFAULT_HEADER_SHRINK_AMOUNT_PERCENT;
      return amount / 100;
    });
    const isScrolled = ref(false);
    const isShrunk = ref(false);
    const runtimeHeaderShrink = computed(() => ({
      active: isShrunk.value,
      ratio: headerShrinkRatio.value
    }));
    const firstSectionOverlaySafe = computed(
      () => isFirstSectionHeaderOverlaySafe(props.bodySchema)
    );
    const wantsHeaderOverlay = computed(
      () => heroIsBackgroundLayout.value || staticHeaderOverlay.value && firstSectionOverlaySafe.value
    );
    const runtimeHeaderOverlay = computed(() => {
      if (!wantsHeaderOverlay.value) {
        return false;
      }
      if (!headerRevealOnScroll.value) {
        return true;
      }
      return !isScrolled.value;
    });
    const runtimeHeaderPosition = computed(() => {
      const headerSchema = props.site?.headerSchema;
      if (!headerSchema || typeof headerSchema !== "object" || Array.isArray(headerSchema)) {
        return "static";
      }
      const behavior = "behavior" in headerSchema ? headerSchema.behavior : null;
      if (behavior && typeof behavior === "object" && !Array.isArray(behavior) && "position" in behavior && behavior.position === "sticky") {
        return "sticky";
      }
      return "static";
    });
    const headerWrapperStyle = computed(() => pickRootBackgroundStyles(props.site?.headerSchema));
    const footerWrapperStyle = computed(() => pickRootBackgroundStyles(props.site?.footerSchema));
    const headerRootMinHeight = computed(() => {
      const [headerRoot] = normalizeSchemaNodes(props.site?.headerSchema);
      const minHeight = headerRoot ? getNodeStyles(headerRoot).minHeight : void 0;
      return typeof minHeight === "string" && minHeight.trim().length > 0 ? minHeight : HEADER_OVERLAY_SPACER_FALLBACK_MIN_HEIGHT;
    });
    const firstBodySectionIsHero = computed(() => {
      const nodes = normalizeBodySectionNodes(props.bodySchema);
      const first = findFirstNonBreadcrumbNode(nodes)?.node;
      return Boolean(first && isHeroSectionName(getNodeName$1(first)));
    });
    const shouldSpaceFirstSectionForOverlay = computed(
      () => runtimeHeaderOverlay.value && firstBodySectionIsHero.value
    );
    const headerOverlaySpacerPaddingTop = computed(
      () => shouldSpaceFirstSectionForOverlay.value ? `calc(${headerRootMinHeight.value} + ${HEADER_OVERLAY_SPACER_BUFFER_PX}px)` : void 0
    );
    const globalHeroMinHeight = computed(() => {
      const styles = props.site?.builderStyles;
      const hero = styles && typeof styles === "object" && !Array.isArray(styles) ? styles.hero : null;
      const minHeight = hero && typeof hero === "object" && !Array.isArray(hero) ? hero.minHeight : null;
      return typeof minHeight === "string" && minHeight.trim().length > 0 ? minHeight : void 0;
    });
    const responsiveCss = computed(
      () => buildResponsiveStylesheet({
        headerSchema: props.site?.headerSchema,
        bodySchema: props.bodySchema,
        footerSchema: props.site?.footerSchema
      })
    );
    provide(runtimeMenusKey, runtimeMenus);
    provide(runtimeHeaderSchemaKey, runtimeHeaderSchema);
    provide(runtimeHeaderOverlayKey, runtimeHeaderOverlay);
    provide(runtimeHeaderShrinkKey, runtimeHeaderShrink);
    provide(runtimeBuilderStylesKey, runtimeBuilderStyles);
    const googleFontsHref = computed(() => {
      const styles = props.site?.builderStyles;
      const typo = styles && typeof styles === "object" && !Array.isArray(styles) ? styles.typography : null;
      const raw = typo && typeof typo === "object" && !Array.isArray(typo) ? typo.googleFonts : null;
      const families = Array.isArray(raw) ? raw.filter((f) => typeof f === "string" && f.trim() !== "") : [];
      if (families.length === 0) return "";
      const params = families.map((f) => `family=${f.replace(/ /g, "+")}`).join("&");
      return `https://fonts.googleapis.com/css2?${params}&display=swap`;
    });
    useHead(() => ({
      link: googleFontsHref.value ? [{ key: "wt-google-fonts", rel: "stylesheet", href: googleFontsHref.value }] : [],
      style: responsiveCss.value ? [{
        key: "wt-responsive-runtime",
        textContent: responsiveCss.value
      }] : []
    }));
    {
      const vary = useResponseHeader("vary");
      vary.value = mergeVaryHeader(vary.value, ["Host", "X-Forwarded-Host"]);
    }
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({
        class: "wt-site",
        style: unref(cssVars),
        "data-public-identifier": __props.entity?.publicIdentifier || "",
        "data-page-width-mode": unref(pageWidthMode)
      }, _attrs))}>`);
      if (__props.site?.headerSchema) {
        _push(`<header class="${ssrRenderClass([{
          "wt-page-header--sticky": unref(runtimeHeaderPosition) === "sticky" && !unref(runtimeHeaderOverlay),
          "wt-page-header--overlay": unref(runtimeHeaderOverlay),
          "wt-page-header--overlay-sticky": unref(runtimeHeaderOverlay) && unref(runtimeHeaderPosition) === "sticky",
          "wt-page-header--solid": !unref(runtimeHeaderOverlay)
        }, "wt-page-header"])}" style="${ssrRenderStyle(unref(runtimeHeaderOverlay) ? void 0 : unref(headerWrapperStyle))}">`);
        _push(ssrRenderComponent(_sfc_main$3, {
          schema: __props.site?.headerSchema,
          scope: "header"
        }, null, _parent));
        _push(`</header>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<main class="wt-main">`);
      ssrRenderSlot(_ctx.$slots, "default", {
        headerOverlaySpacerPaddingTop: unref(headerOverlaySpacerPaddingTop),
        globalHeroMinHeight: unref(globalHeroMinHeight)
      }, null, _push, _parent);
      _push(`</main>`);
      if (__props.site?.footerSchema) {
        _push(`<footer class="wt-page-footer" style="${ssrRenderStyle(unref(footerWrapperStyle))}">`);
        _push(ssrRenderComponent(_sfc_main$3, {
          schema: __props.site?.footerSchema,
          scope: "footer"
        }, null, _parent));
        _push(`</footer>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/public/PublicSiteShell.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
function resolveApiBase(apiBase) {
  const config = /* @__PURE__ */ useRuntimeConfig();
  return `${config.publicApiBase || config.public.apiBase}/api/public`;
}
async function fetchPublicPage(host, path, apiBase) {
  const base = resolveApiBase();
  return await $fetch(`${base}/page`, {
    params: { host, path }
  });
}
async function fetchPublicResolve(host, path, apiBase) {
  const base = resolveApiBase();
  return await $fetch(`${base}/resolve`, {
    params: { host, path }
  });
}
async function fetchPublicSite(host, apiBase) {
  const base = resolveApiBase();
  return await $fetch(`${base}/site`, {
    params: { host }
  });
}
async function fetchPublicRoutes(host, apiBase) {
  const base = resolveApiBase();
  return await $fetch(`${base}/routes`, {
    params: { host }
  });
}
async function fetchPublicTemplate(host, type, apiBase) {
  const base = resolveApiBase();
  return await $fetch(`${base}/template`, {
    params: { host, type }
  });
}
async function fetchPublicContentItem(host, type, slug, apiBase) {
  const base = resolveApiBase();
  return await $fetch(`${base}/content`, {
    params: { host, type, slug }
  });
}
async function fetchPublicContentList(host, type, params, apiBase) {
  const base = resolveApiBase();
  return await $fetch(`${base}/content-list`, {
    params: {
      host,
      type,
      count: params.count,
      current: params.current ?? 1,
      categorySlug: params.categorySlug ?? void 0,
      taxonomyType: params.taxonomyType ?? void 0,
      taxonomySlug: params.taxonomySlug ?? void 0
    }
  });
}
defineComponent({
  name: "ServerPlaceholder",
  render() {
    return createElementBlock("div");
  }
});
const clientOnlySymbol = /* @__PURE__ */ Symbol.for("nuxt:client-only");
defineComponent({
  name: "ClientOnly",
  inheritAttrs: false,
  props: ["fallback", "placeholder", "placeholderTag", "fallbackTag"],
  ...false,
  setup(props, { slots, attrs }) {
    const mounted = shallowRef(false);
    const vm = getCurrentInstance();
    if (vm) {
      vm._nuxtClientOnly = true;
    }
    provide(clientOnlySymbol, true);
    return () => {
      if (mounted.value) {
        const vnodes = slots.default?.();
        if (vnodes && vnodes.length === 1) {
          return [cloneVNode(vnodes[0], attrs)];
        }
        return vnodes;
      }
      const slot = slots.fallback || slots.placeholder;
      if (slot) {
        return h(slot);
      }
      const fallbackStr = props.fallback || props.placeholder || "";
      const fallbackTag = props.fallbackTag || props.placeholderTag || "span";
      return createElementBlock(fallbackTag, attrs, fallbackStr);
    };
  }
});
const isDefer = (dedupe) => dedupe === "defer" || dedupe === false;
function useAsyncData(...args) {
  const autoKey = typeof args[args.length - 1] === "string" ? args.pop() : void 0;
  if (_isAutoKeyNeeded(args[0], args[1])) {
    args.unshift(autoKey);
  }
  let [_key, _handler, options = {}] = args;
  const key = computed(() => toValue(_key));
  if (typeof key.value !== "string") {
    throw new TypeError("[nuxt] [useAsyncData] key must be a string.");
  }
  if (typeof _handler !== "function") {
    throw new TypeError("[nuxt] [useAsyncData] handler must be a function.");
  }
  const nuxtApp = useNuxtApp();
  options.server ??= true;
  options.default ??= getDefault;
  options.getCachedData ??= getDefaultCachedData;
  options.lazy ??= false;
  options.immediate ??= true;
  options.deep ??= asyncDataDefaults.deep;
  options.dedupe ??= "cancel";
  options._functionName || "useAsyncData";
  nuxtApp._asyncData[key.value];
  function createInitialFetch() {
    const initialFetchOptions = { cause: "initial", dedupe: options.dedupe };
    if (!nuxtApp._asyncData[key.value]?._init) {
      initialFetchOptions.cachedData = options.getCachedData(key.value, nuxtApp, { cause: "initial" });
      nuxtApp._asyncData[key.value] = createAsyncData(nuxtApp, key.value, _handler, options, initialFetchOptions.cachedData);
    }
    return () => nuxtApp._asyncData[key.value].execute(initialFetchOptions);
  }
  const initialFetch = createInitialFetch();
  const asyncData = nuxtApp._asyncData[key.value];
  asyncData._deps++;
  const fetchOnServer = options.server !== false && nuxtApp.payload.serverRendered;
  if (fetchOnServer && options.immediate) {
    const promise = initialFetch();
    if (getCurrentInstance()) {
      onServerPrefetch(() => promise);
    } else {
      nuxtApp.hook("app:created", async () => {
        await promise;
      });
    }
  }
  const asyncReturn = {
    data: writableComputedRef(() => nuxtApp._asyncData[key.value]?.data),
    pending: writableComputedRef(() => nuxtApp._asyncData[key.value]?.pending),
    status: writableComputedRef(() => nuxtApp._asyncData[key.value]?.status),
    error: writableComputedRef(() => nuxtApp._asyncData[key.value]?.error),
    refresh: (...args2) => {
      if (!nuxtApp._asyncData[key.value]?._init) {
        const initialFetch2 = createInitialFetch();
        return initialFetch2();
      }
      return nuxtApp._asyncData[key.value].execute(...args2);
    },
    execute: (...args2) => asyncReturn.refresh(...args2),
    clear: () => {
      const entry2 = nuxtApp._asyncData[key.value];
      if (entry2?._abortController) {
        try {
          entry2._abortController.abort(new DOMException("AsyncData aborted by user.", "AbortError"));
        } finally {
          entry2._abortController = void 0;
        }
      }
      clearNuxtDataByKey(nuxtApp, key.value);
    }
  };
  const asyncDataPromise = Promise.resolve(nuxtApp._asyncDataPromises[key.value]).then(() => asyncReturn);
  Object.assign(asyncDataPromise, asyncReturn);
  Object.defineProperties(asyncDataPromise, {
    then: { enumerable: true, value: asyncDataPromise.then.bind(asyncDataPromise) },
    catch: { enumerable: true, value: asyncDataPromise.catch.bind(asyncDataPromise) },
    finally: { enumerable: true, value: asyncDataPromise.finally.bind(asyncDataPromise) }
  });
  return asyncDataPromise;
}
function writableComputedRef(getter) {
  return computed({
    get() {
      return getter()?.value;
    },
    set(value) {
      const ref2 = getter();
      if (ref2) {
        ref2.value = value;
      }
    }
  });
}
function _isAutoKeyNeeded(keyOrFetcher, fetcher) {
  if (typeof keyOrFetcher === "string") {
    return false;
  }
  if (typeof keyOrFetcher === "object" && keyOrFetcher !== null) {
    return false;
  }
  if (typeof keyOrFetcher === "function" && typeof fetcher === "function") {
    return false;
  }
  return true;
}
function clearNuxtDataByKey(nuxtApp, key) {
  if (key in nuxtApp.payload.data) {
    nuxtApp.payload.data[key] = void 0;
  }
  if (key in nuxtApp.payload._errors) {
    nuxtApp.payload._errors[key] = asyncDataDefaults.errorValue;
  }
  if (nuxtApp._asyncData[key]) {
    nuxtApp._asyncData[key].data.value = void 0;
    nuxtApp._asyncData[key].error.value = asyncDataDefaults.errorValue;
    {
      nuxtApp._asyncData[key].pending.value = false;
    }
    nuxtApp._asyncData[key].status.value = "idle";
  }
  if (key in nuxtApp._asyncDataPromises) {
    nuxtApp._asyncDataPromises[key] = void 0;
  }
}
function pick(obj, keys) {
  const newObj = {};
  for (const key of keys) {
    newObj[key] = obj[key];
  }
  return newObj;
}
function createAsyncData(nuxtApp, key, _handler, options, initialCachedData) {
  nuxtApp.payload._errors[key] ??= asyncDataDefaults.errorValue;
  const hasCustomGetCachedData = options.getCachedData !== getDefaultCachedData;
  const handler = _handler ;
  const _ref = options.deep ? ref : shallowRef;
  const hasCachedData = initialCachedData != null;
  const unsubRefreshAsyncData = nuxtApp.hook("app:data:refresh", async (keys) => {
    if (!keys || keys.includes(key)) {
      await asyncData.execute({ cause: "refresh:hook" });
    }
  });
  const asyncData = {
    data: _ref(hasCachedData ? initialCachedData : options.default()),
    pending: shallowRef(!hasCachedData),
    error: toRef(nuxtApp.payload._errors, key),
    status: shallowRef("idle"),
    execute: (...args) => {
      const [_opts, newValue = void 0] = args;
      const opts = _opts && newValue === void 0 && typeof _opts === "object" ? _opts : {};
      if (nuxtApp._asyncDataPromises[key]) {
        if (isDefer(opts.dedupe ?? options.dedupe)) {
          return nuxtApp._asyncDataPromises[key];
        }
      }
      if (opts.cause === "initial" || nuxtApp.isHydrating) {
        const cachedData = "cachedData" in opts ? opts.cachedData : options.getCachedData(key, nuxtApp, { cause: opts.cause ?? "refresh:manual" });
        if (cachedData != null) {
          nuxtApp.payload.data[key] = asyncData.data.value = cachedData;
          asyncData.error.value = asyncDataDefaults.errorValue;
          asyncData.status.value = "success";
          return Promise.resolve(cachedData);
        }
      }
      {
        asyncData.pending.value = true;
      }
      if (asyncData._abortController) {
        asyncData._abortController.abort(new DOMException("AsyncData request cancelled by deduplication", "AbortError"));
      }
      asyncData._abortController = new AbortController();
      asyncData.status.value = "pending";
      const cleanupController = new AbortController();
      const promise = new Promise(
        (resolve, reject) => {
          try {
            const timeout = opts.timeout ?? options.timeout;
            const mergedSignal = mergeAbortSignals([asyncData._abortController?.signal, opts?.signal], cleanupController.signal, timeout);
            if (mergedSignal.aborted) {
              const reason = mergedSignal.reason;
              reject(reason instanceof Error ? reason : new DOMException(String(reason ?? "Aborted"), "AbortError"));
              return;
            }
            mergedSignal.addEventListener("abort", () => {
              const reason = mergedSignal.reason;
              reject(reason instanceof Error ? reason : new DOMException(String(reason ?? "Aborted"), "AbortError"));
            }, { once: true, signal: cleanupController.signal });
            return Promise.resolve(handler(nuxtApp, { signal: mergedSignal })).then(resolve, reject);
          } catch (err) {
            reject(err);
          }
        }
      ).then(async (_result) => {
        let result = _result;
        if (options.transform) {
          result = await options.transform(_result);
        }
        if (options.pick) {
          result = pick(result, options.pick);
        }
        nuxtApp.payload.data[key] = result;
        asyncData.data.value = result;
        asyncData.error.value = asyncDataDefaults.errorValue;
        asyncData.status.value = "success";
      }).catch((error) => {
        if (nuxtApp._asyncDataPromises[key] && nuxtApp._asyncDataPromises[key] !== promise) {
          return nuxtApp._asyncDataPromises[key];
        }
        if (asyncData._abortController?.signal.aborted) {
          return nuxtApp._asyncDataPromises[key];
        }
        if (typeof DOMException !== "undefined" && error instanceof DOMException && error.name === "AbortError") {
          asyncData.status.value = "idle";
          return nuxtApp._asyncDataPromises[key];
        }
        asyncData.error.value = createError(error);
        asyncData.data.value = unref(options.default());
        asyncData.status.value = "error";
      }).finally(() => {
        {
          asyncData.pending.value = false;
        }
        cleanupController.abort();
        delete nuxtApp._asyncDataPromises[key];
      });
      nuxtApp._asyncDataPromises[key] = promise;
      return nuxtApp._asyncDataPromises[key];
    },
    _execute: debounce((...args) => asyncData.execute(...args), 0, { leading: true }),
    _default: options.default,
    _deps: 0,
    _init: true,
    _hash: void 0,
    _off: () => {
      unsubRefreshAsyncData();
      if (nuxtApp._asyncData[key]?._init) {
        nuxtApp._asyncData[key]._init = false;
      }
      if (!hasCustomGetCachedData) {
        nextTick(() => {
          if (!nuxtApp._asyncData[key]?._init) {
            clearNuxtDataByKey(nuxtApp, key);
            asyncData.execute = () => Promise.resolve();
            asyncData.data.value = asyncDataDefaults.value;
          }
        });
      }
    }
  };
  return asyncData;
}
const getDefault = () => asyncDataDefaults.value;
const getDefaultCachedData = (key, nuxtApp, ctx) => {
  if (nuxtApp.isHydrating) {
    return nuxtApp.payload.data[key];
  }
  if (ctx.cause !== "refresh:manual" && ctx.cause !== "refresh:hook") {
    return nuxtApp.static.data[key];
  }
};
function mergeAbortSignals(signals, cleanupSignal, timeout) {
  const list = signals.filter((s) => !!s);
  if (typeof timeout === "number" && timeout >= 0) {
    const timeoutSignal = AbortSignal.timeout?.(timeout);
    if (timeoutSignal) {
      list.push(timeoutSignal);
    }
  }
  if (AbortSignal.any) {
    return AbortSignal.any(list);
  }
  const controller = new AbortController();
  for (const sig of list) {
    if (sig.aborted) {
      const reason = sig.reason ?? new DOMException("Aborted", "AbortError");
      try {
        controller.abort(reason);
      } catch {
        controller.abort();
      }
      return controller.signal;
    }
  }
  const onAbort = () => {
    const abortedSignal = list.find((s) => s.aborted);
    const reason = abortedSignal?.reason ?? new DOMException("Aborted", "AbortError");
    try {
      controller.abort(reason);
    } catch {
      controller.abort();
    }
  };
  for (const sig of list) {
    sig.addEventListener?.("abort", onAbort, { once: true, signal: cleanupSignal });
  }
  return controller.signal;
}
const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "error",
  __ssrInlineRender: true,
  props: {
    error: {}
  },
  async setup(__props) {
    let __temp, __restore;
    const props = __props;
    const isNotFound = computed(() => (props.error?.statusCode ?? 500) === 404);
    const title = computed(() => isNotFound.value ? "Page not found" : "Something went wrong");
    const message = computed(
      () => isNotFound.value ? "The page you're looking for doesn't exist or may have been moved." : props.error?.statusMessage || "Something went wrong."
    );
    const host = getRequestHost();
    const { data: site } = ([__temp, __restore] = withAsyncContext(() => useAsyncData(
      () => `error-site:${host}`,
      () => isNotFound.value ? fetchPublicSite(host) : Promise.resolve(null),
      { default: () => null }
    )), __temp = await __temp, __restore(), __temp);
    useHead({ title });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      if (unref(site)?.entity && unref(site)?.site) {
        _push(ssrRenderComponent(_sfc_main$2, mergeProps({
          entity: unref(site).entity,
          site: unref(site).site
        }, _attrs), {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<div class="wt-error-page" data-v-1cae10e5${_scopeId}><p class="wt-error-code" data-v-1cae10e5${_scopeId}>${ssrInterpolate(__props.error?.statusCode || 500)}</p><h1 class="wt-error-title" data-v-1cae10e5${_scopeId}>${ssrInterpolate(unref(title))}</h1><p class="wt-error-message" data-v-1cae10e5${_scopeId}>${ssrInterpolate(unref(message))}</p>`);
              _push2(ssrRenderComponent(_component_NuxtLink, {
                class: "wt-error-link",
                to: "/"
              }, {
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(` Go home `);
                  } else {
                    return [
                      createTextVNode(" Go home ")
                    ];
                  }
                }),
                _: 1
              }, _parent2, _scopeId));
              _push2(`</div>`);
            } else {
              return [
                createVNode("div", { class: "wt-error-page" }, [
                  createVNode("p", { class: "wt-error-code" }, toDisplayString(__props.error?.statusCode || 500), 1),
                  createVNode("h1", { class: "wt-error-title" }, toDisplayString(unref(title)), 1),
                  createVNode("p", { class: "wt-error-message" }, toDisplayString(unref(message)), 1),
                  createVNode(_component_NuxtLink, {
                    class: "wt-error-link",
                    to: "/"
                  }, {
                    default: withCtx(() => [
                      createTextVNode(" Go home ")
                    ]),
                    _: 1
                  })
                ])
              ];
            }
          }),
          _: 1
        }, _parent));
      } else {
        _push(`<main${ssrRenderAttrs(mergeProps({ class: "wt-error-page wt-error-page--bare" }, _attrs))} data-v-1cae10e5><p class="wt-error-code" data-v-1cae10e5>${ssrInterpolate(__props.error?.statusCode || 500)}</p><h1 class="wt-error-title" data-v-1cae10e5>${ssrInterpolate(unref(title))}</h1><p class="wt-error-message" data-v-1cae10e5>${ssrInterpolate(unref(message))}</p>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          class: "wt-error-link",
          to: "/"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(` Go home `);
            } else {
              return [
                createTextVNode(" Go home ")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</main>`);
      }
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("error.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const ErrorComponent = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["__scopeId", "data-v-1cae10e5"]]);
const _sfc_main = {
  __name: "nuxt-root",
  __ssrInlineRender: true,
  setup(__props) {
    const IslandRenderer = () => null;
    const nuxtApp = useNuxtApp();
    nuxtApp.deferHydration();
    nuxtApp.ssrContext.url;
    const SingleRenderer = false;
    provide(PageRouteSymbol, useRoute());
    nuxtApp.hooks.callHookWith((hooks) => hooks.map((hook) => hook()), "vue:setup");
    const error = /* @__PURE__ */ useError();
    const abortRender = error.value && !nuxtApp.ssrContext.error;
    onErrorCaptured((err, target, info) => {
      nuxtApp.hooks.callHook("vue:error", err, target, info).catch((hookError) => console.error("[nuxt] Error in `vue:error` hook", hookError));
      {
        const p = nuxtApp.runWithContext(() => showError(err));
        onServerPrefetch(() => p);
        return false;
      }
    });
    const islandContext = nuxtApp.ssrContext.islandContext;
    return (_ctx, _push, _parent, _attrs) => {
      ssrRenderSuspense(_push, {
        default: () => {
          if (unref(abortRender)) {
            _push(`<div></div>`);
          } else if (unref(error)) {
            _push(ssrRenderComponent(unref(ErrorComponent), { error: unref(error) }, null, _parent));
          } else if (unref(islandContext)) {
            _push(ssrRenderComponent(unref(IslandRenderer), { context: unref(islandContext) }, null, _parent));
          } else if (unref(SingleRenderer)) {
            ssrRenderVNode(_push, createVNode(resolveDynamicComponent(unref(SingleRenderer)), null, null), _parent);
          } else {
            _push(ssrRenderComponent(unref(AppComponent), null, null, _parent));
          }
        },
        _: 1
      });
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/nuxt/dist/app/components/nuxt-root.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
let entry;
{
  entry = async function createNuxtAppServer(ssrContext) {
    const vueApp = createApp(_sfc_main);
    const nuxt = createNuxtApp({ vueApp, ssrContext });
    try {
      await applyPlugins(nuxt, plugins);
      await nuxt.hooks.callHook("app:created", vueApp);
    } catch (error) {
      await nuxt.hooks.callHook("app:error", error);
      nuxt.payload.error ||= createError(error);
    }
    if (ssrContext && (ssrContext["~renderResponse"] || ssrContext._renderResponse)) {
      throw new Error("skipping render");
    }
    return vueApp;
  };
}
const entry_default = ((ssrContext) => entry(ssrContext));

export { runtimeHeaderOverlayKey as A, runtimeHeaderShrinkKey as B, getNodeChildren as C, getStringField as D, ElementRenderer as E, getNodeKey as F, getNodeField as G, getBooleanField as H, getNodeName$1 as I, runtimeMenusKey as J, runtimeHeaderSchemaKey as K, normalizeSchemaNodes as L, getArrayField as M, getNodeContentRecord as N, getNodeContent as O, _export_sfc as _, fetchPublicContentItem as a, useHead as b, createError as c, _sfc_main$2 as d, entry_default as default, _sfc_main$3 as e, fetchPublicTemplate as f, getRequestHost as g, fetchPublicContentList as h, useRoute as i, fetchPublicResolve as j, fetchPublicPage as k, fetchPublicRoutes as l, useRuntimeConfig as m, navigateTo as n, fetchPublicSite as o, normalizeHost as p, isLocalPlatformRequestHost as q, preferRequestHost as r, showError as s, getNodeClasses as t, useAsyncData as u, getNodeDomId as v, getNodeStyles as w, __nuxt_component_0 as x, normalizeBlockType as y, runtimeBuilderStylesKey as z };
//# sourceMappingURL=server.mjs.map
