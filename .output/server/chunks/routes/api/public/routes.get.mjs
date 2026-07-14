import { d as defineEventHandler, a as getQuery, u as useRuntimeConfig } from '../../../nitro/nitro.mjs';
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

export { routes_get as default };
//# sourceMappingURL=routes.get.mjs.map
