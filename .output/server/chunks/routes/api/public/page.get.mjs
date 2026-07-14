import { d as defineEventHandler, a as getQuery, u as useRuntimeConfig } from '../../../nitro/nitro.mjs';
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

export { page_get as default };
//# sourceMappingURL=page.get.mjs.map
