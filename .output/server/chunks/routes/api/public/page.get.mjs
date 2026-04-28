globalThis.__timing__.logStart('Load chunks/routes/api/public/page.get');import { d as defineEventHandler, g as getQuery, u as useRuntimeConfig } from '../../../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';

const page_get = defineEventHandler(async (event) => {
  const { host, path } = getQuery(event);
  const config = useRuntimeConfig();
  return await $fetch(`${config.publicApiBase}/api/public/page`, {
    params: { host, path }
  });
});

export { page_get as default };;globalThis.__timing__.logEnd('Load chunks/routes/api/public/page.get');
//# sourceMappingURL=page.get.mjs.map
