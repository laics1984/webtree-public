import { isPlatformRequestHost, normalizeHostname } from '~/lib/host'

export const NOINDEX_ROBOTS = 'noindex, nofollow'

/**
 * Crawlers that build answer/training corpora rather than a search index. They do
 * not honour `noindex` (there is no index entry to suppress), so a robots.txt
 * `Disallow` is the only lever available against them.
 */
const AI_CRAWLER_USER_AGENTS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-User',
  'Claude-SearchBot',
  'anthropic-ai',
  'PerplexityBot',
  'Perplexity-User',
  'CCBot',
  'Google-Extended',
  'Applebot-Extended',
  'meta-externalagent',
  'Bytespider',
  'Amazonbot',
  'cohere-ai'
]

/** Built once at module load — no per-request cost. */
export const AI_CRAWLER_DISALLOW_POLICY = AI_CRAWLER_USER_AGENTS
  .map((agent) => `User-agent: ${agent}\nDisallow: /`)
  .join('\n\n')

/**
 * Whether content served on this host may be indexed.
 *
 * Only client custom domains are indexable. Anything on the platform domain — a
 * per-site subdomain or the base domain itself — is a preview surface that must
 * stay out of search and answer engines, so that a client's own domain is never
 * competing with a duplicate.
 *
 * Fails closed on the host: a missing or unparseable host is non-indexable.
 * Fails open on the platform base domain: if it is unset, hosts stay indexable
 * rather than deindexing every live client domain over a config mistake.
 */
export function isIndexableHost(requestHost?: string | null, platformBaseDomain?: string | null): boolean {
  const hostname = normalizeHostname(requestHost)

  if (!hostname) {
    return false
  }

  if (hostname === normalizeHostname(platformBaseDomain)) {
    return false
  }

  return !isPlatformRequestHost(requestHost, platformBaseDomain)
}
