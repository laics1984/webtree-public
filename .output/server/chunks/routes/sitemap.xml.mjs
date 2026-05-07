import { d as defineEventHandler, u as useRuntimeConfig, a as getHeader, s as setHeader, c as createError } from '../nitro/nitro.mjs';
import { n as normalizeHost, m as mergeVaryHeader, a as fetchPublicRoutes, c as buildSitemapXml, g as getPublicFeedStatusCode } from '../_/publicFeed.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';

const sitemap_xml = defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const host = normalizeHost(String(getHeader(event, "x-forwarded-host") || getHeader(event, "host") || ""));
  setHeader(event, "Vary", mergeVaryHeader(getHeader(event, "vary"), ["Host", "X-Forwarded-Host"]));
  setHeader(event, "Content-Type", "application/xml; charset=utf-8");
  if (!host) {
    throw createError({ statusCode: 400, statusMessage: "Missing host header" });
  }
  try {
    const data = await fetchPublicRoutes(host);
    return buildSitemapXml(data, host, config.public.siteProtocol, config.public.platformBaseDomain);
  } catch (error) {
    const statusCode = getPublicFeedStatusCode(error);
    throw createError({
      statusCode: statusCode === 404 ? 404 : 502,
      statusMessage: statusCode === 404 ? "Sitemap not found" : "Unable to load sitemap.xml right now."
    });
  }
});

export { sitemap_xml as default };
//# sourceMappingURL=sitemap.xml.mjs.map
