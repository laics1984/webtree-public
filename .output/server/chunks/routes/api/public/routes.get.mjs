globalThis.__timing__.logStart('Load chunks/routes/api/public/routes.get');import { d as defineEventHandler, g as getQuery, u as useRuntimeConfig } from '../../../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';

const routes_get = defineEventHandler(async (event) => {
  const { host } = getQuery(event);
  const config = useRuntimeConfig();
  return await $fetch(`${config.publicApiBase}/api/public/routes`, {
    params: { host }
  });
});

export { routes_get as default };;globalThis.__timing__.logEnd('Load chunks/routes/api/public/routes.get');
//# sourceMappingURL=routes.get.mjs.map
