globalThis.__timing__.logStart('Load chunks/_/publicFeed');import { u as useRuntimeConfig } from '../nitro/nitro.mjs';

function resolveApiBase(apiBase) {
  const config = useRuntimeConfig();
  return `${config.publicApiBase || config.public.apiBase}/api/public`;
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

function firstForwardedValue(value) {
  var _a;
  return ((_a = (value || "").split(",")[0]) == null ? void 0 : _a.trim()) || "";
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
  const hostname = ((portMatch == null ? void 0 : portMatch[1]) || candidate).replace(/^\.+|\.+$/g, "");
  const port = (portMatch == null ? void 0 : portMatch[2]) || "";
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
function mergeVaryHeader(existing, values) {
  const incoming = Array.isArray(values) ? values : [values];
  const merged = /* @__PURE__ */ new Map();
  for (const entry of [existing || "", ...incoming]) {
    for (const token of entry.split(",")) {
      const normalized = token.trim();
      if (!normalized) {
        continue;
      }
      merged.set(normalized.toLowerCase(), normalized);
    }
  }
  return Array.from(merged.values()).join(", ");
}

const DEFAULT_ROBOTS_TXT = "User-agent: *\nAllow: /\n";
const VALID_CHANGE_FREQUENCIES = /* @__PURE__ */ new Set([
  "always",
  "hourly",
  "daily",
  "weekly",
  "monthly",
  "yearly",
  "never"
]);
function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}
function escapeXml(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
}
function normalizeMultilineText(value) {
  return value.replace(/\r\n?/g, "\n").trim();
}
function normalizePublicPath(path) {
  if (typeof path !== "string") {
    return null;
  }
  if (!path.trim()) {
    return "/";
  }
  try {
    const normalized = new URL(path, "https://webtree.invalid");
    if (!["http:", "https:"].includes(normalized.protocol)) {
      return null;
    }
    return normalized.pathname || "/";
  } catch {
    const trimmed = path.trim().split(/[?#]/)[0] || "/";
    return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  }
}
function normalizeLastModified(value) {
  if (!hasText(value)) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? null : date.toISOString();
}
function normalizeChangeFrequency(value) {
  if (!hasText(value)) {
    return null;
  }
  const normalized = value.trim().toLowerCase();
  return VALID_CHANGE_FREQUENCIES.has(normalized) ? normalized : null;
}
function normalizePriority(value) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null;
  }
  const clamped = Math.max(0, Math.min(1, value));
  return String(clamped);
}
function normalizeSiteProtocol(value) {
  return value === "http" ? "http" : "https";
}
function resolvePublicHost(source, requestHost, platformBaseDomain) {
  const normalizedRequestHost = normalizeHost(requestHost);
  if (isLocalPlatformRequestHost(normalizedRequestHost, platformBaseDomain)) {
    return normalizedRequestHost;
  }
  const preferredHost = normalizeHost((source == null ? void 0 : source.canonicalHost) || (source == null ? void 0 : source.resolvedHost) || normalizedRequestHost) || normalizedRequestHost;
  return preferRequestHost(preferredHost, normalizedRequestHost);
}
function buildAbsolutePublicUrl(source, requestHost, path, siteProtocol = "https", platformBaseDomain) {
  const host = resolvePublicHost(source, requestHost, platformBaseDomain) || "localhost";
  const pathname = normalizePublicPath(path) || "/";
  const protocol = normalizeSiteProtocol(siteProtocol);
  return new URL(pathname, `${protocol}://${host}`).toString();
}
function buildRobotsTxt(data, requestHost, siteProtocol = "https", platformBaseDomain) {
  var _a;
  const explicitPolicy = hasText((_a = data.site.defaults) == null ? void 0 : _a.robotsTxt) ? data.site.defaults.robotsTxt : "";
  const normalizedBasePolicy = explicitPolicy ? normalizeMultilineText(explicitPolicy).split("\n").filter((line) => !/^sitemap:/i.test(line.trim())).join("\n") : DEFAULT_ROBOTS_TXT.trim();
  const basePolicy = normalizedBasePolicy || DEFAULT_ROBOTS_TXT.trim();
  const sitemapUrl = buildAbsolutePublicUrl(data.entity, requestHost, "/sitemap.xml", siteProtocol, platformBaseDomain);
  return `${basePolicy}
Sitemap: ${sitemapUrl}
`;
}
function buildSitemapXml(data, requestHost, siteProtocol = "https", platformBaseDomain) {
  const seen = /* @__PURE__ */ new Set();
  const items = (data.routes || []).filter((route) => !route.noindex).flatMap((route) => {
    const path = normalizePublicPath(route.path);
    if (!path) {
      return [];
    }
    const location = buildAbsolutePublicUrl(data, requestHost, path, siteProtocol, platformBaseDomain);
    if (seen.has(location)) {
      return [];
    }
    seen.add(location);
    const fragments = [`<loc>${escapeXml(location)}</loc>`];
    const lastModified = normalizeLastModified(route.updatedAt);
    const changeFrequency = normalizeChangeFrequency(route.changeFrequency);
    const priority = normalizePriority(route.priority);
    if (lastModified) {
      fragments.push(`<lastmod>${escapeXml(lastModified)}</lastmod>`);
    }
    if (changeFrequency) {
      fragments.push(`<changefreq>${escapeXml(changeFrequency)}</changefreq>`);
    }
    if (priority) {
      fragments.push(`<priority>${escapeXml(priority)}</priority>`);
    }
    return [`  <url>${fragments.join("")}</url>`];
  });
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...items,
    "</urlset>"
  ].join("\n");
}
function getPublicFeedStatusCode(error) {
  if (!error || typeof error !== "object") {
    return 500;
  }
  if ("statusCode" in error && typeof error.statusCode === "number") {
    return error.statusCode;
  }
  if ("status" in error && typeof error.status === "number") {
    return error.status;
  }
  if ("response" in error && error.response && typeof error.response === "object" && "status" in error.response && typeof error.response.status === "number") {
    return error.response.status;
  }
  if ("data" in error && error.data && typeof error.data === "object" && "statusCode" in error.data && typeof error.data.statusCode === "number") {
    return error.data.statusCode;
  }
  return 500;
}

export { fetchPublicRoutes as a, buildRobotsTxt as b, buildSitemapXml as c, fetchPublicSite as f, getPublicFeedStatusCode as g, mergeVaryHeader as m, normalizeHost as n };;globalThis.__timing__.logEnd('Load chunks/_/publicFeed');
//# sourceMappingURL=publicFeed.mjs.map
