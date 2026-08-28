# Cloudflare custom-domain setup

Operational scripts for putting client custom domains onto this Worker via
Cloudflare for SaaS. Run once, in order, by a human with zone access.

Custom domains do not reach this Worker until two things exist: a **registered
custom hostname** on the `myfowable.com` zone, and a **Worker route that matches
it**. `*.public.myfowable.com/*` cannot match `clientdomain.com`, so the route
has to widen to `*/*` — which is why the asset exclusion below matters.

## Why the exclusion route exists

> ⚠️ **`asset.myfowable.com` is an R2 custom domain on the same zone.**
> Cloudflare: *"Routes … take precedence if configured on the same hostname."*
> A bare `*/*` route would intercept every asset request and hand it to the
> Worker instead of the bucket — every image on every client site.

The fix is a route with **no Worker attached**, which *"acts to negate any less
specific patterns"*:

| Route | Worker |
|---|---|
| `asset.myfowable.com/*` | **none** |
| `*/*` | `fowable-public` |

**This exclusion is not in `wrangler.jsonc`** and cannot be — wrangler only
manages routes for the Worker it deploys. It lives in the Cloudflare zone
config, created by `03-exclusion-route.sh`. If you are wondering why assets
still work under a `*/*` route, that route is the answer. Do not delete it.

`asset.fowable.com` is also an R2 custom domain but sits on the `fowable.com`
zone, out of reach of a `myfowable.com` route. It needs nothing.

## Setup

```bash
export CLOUDFLARE_API_TOKEN='...'
cd scripts/cloudflare
chmod +x *.sh
```

Token permissions, scoped to the `myfowable.com` zone only
([create one here](https://dash.cloudflare.com/profile/api-tokens)):

| Permission | Level |
|---|---|
| Zone → DNS | Read |
| Zone → Workers Routes | Edit |
| Zone → SSL and Certificates | Edit |

The token is passed as a header and is never printed or written to disk.

## Separate: `fix-platform-wildcard.sh`

Not part of the numbered flow. Fixes a distinct, live problem — **tenant platform
subdomains do not resolve at all**:

```
gemj8wosnium.public.myfowable.com  ->  no DNS record (authoritative NS returns SOA)
```

A Worker route does not create DNS. `*.public.myfowable.com/*` filters traffic
that *arrives* at the zone; if the hostname does not resolve, nothing arrives and
the route is inert. The fix is one proxied wildcard record pointing at
`192.0.2.0` (RFC 5737 documentation address, never contacted — the Worker
intercepts first).

```bash
./fix-platform-wildcard.sh
TENANT_HOST=gemj8wosnium.public.myfowable.com ./fix-platform-wildcard.sh   # also verifies a real site
```

Idempotent; fixes an existing record that is unproxied; verifies against
Cloudflare's authoritative nameserver rather than a cache. Needs **Zone → DNS →
Edit** (the audit token only has Read).

This also unblocks custom domains: `EntityDomainService::dnsInstructions()`
currently tells clients to CNAME to `{identifier}.public.myfowable.com`, which
does not resolve today.

## Run order

> **`myfowable.com` is production.** There is no staging zone. Scripts marked
> "changes anything" write to the live zone, so `00-rehearse.sh` exists to prove
> the mechanism on a disposable hostname before real asset traffic is anywhere
> near it. Do not skip it.

| | Script | Changes anything? | What it does |
|---|---|---|---|
| 0 | `00-rehearse.sh <test-url>` | only a throwaway host | Proves a Worker route intercepts an R2 custom domain, **and** that a no-Worker route restores it. Self-cleaning. |
| 1 | `01-audit.sh` | no | Lists every proxied hostname a `*/*` route would capture, plus existing routes, the CNAME target, the tenant wildcard, and the fallback origin. |
| 2 | `02-baseline.sh <asset-url>` | no | Records how a real R2 object serves **before** any change. |
| 3 | `03-exclusion-route.sh` | **yes** | Creates `asset.myfowable.com/*` → no Worker. Idempotent; reads back and verifies. |
| 4 | `04-gate.sh` | no | Compares assets against the baseline. **Run again after deploying `*/*` — that run is the one that counts.** |
| 5 | *(deploy `*/*`)* | **yes** | Edit `wrangler.jsonc`, then deploy. See below. |
| 6 | `04-gate.sh` | no | The real gate. Fails → pull the route immediately. |
| 7 | `05-fallback-origin.sh` | **yes** | Designates `public.myfowable.com` as the fallback origin. |

Mutating scripts print exactly what they will do and require typing `yes`.

### Step 0 — the rehearsal

Two assumptions underpin this whole approach, and Cloudflare documents neither
outright: that a Worker route **intercepts** an R2 custom domain on the same
zone, and that a no-Worker route **restores** it. Testing them on
`asset.myfowable.com` would mean risking every client's images on a hypothesis.

Instead, connect a disposable custom domain to any bucket with a public object:

```
R2 -> bucket -> Settings -> Custom Domains -> Connect Domain
   -> assettest.myfowable.com
```

Then:

```bash
./00-rehearse.sh https://assettest.myfowable.com/path/to/object.jpg
```

It attaches a Worker route, checks whether serving changed, swaps to a no-Worker
route, checks whether it recovered, and deletes its own route on exit — including
after a failure. It refuses to run against `asset.myfowable.com` or any host
outside the zone. Remove the throwaway custom domain afterwards.

A `BOTH ASSUMPTIONS HOLD` verdict means the plan is sound. Anything else is told
to you plainly, with what to do instead.

### Step 5 — the `*/*` route

Only after `04-gate.sh` passes at step 4:

```jsonc
"routes": [
  { "pattern": "*/*", "zone_name": "myfowable.com" }
]
```

This repo deploys on push to `master`, so merging is what makes it live. Have
`04-gate.sh` ready to run the moment it deploys.

## If the gate fails

```
1. Remove the */* route  — restores asset serving immediately
2. Re-run ./04-gate.sh   — confirm assets recovered
3. Change approach       — serve assets from asset.fowable.com (different zone,
                           no exclusion needed), or move the Worker to its own zone
```

Route specificity and no-Worker negation are both documented. That a no-Worker
exclusion cleanly restores *R2 custom domain* serving is an inference — which is
precisely why it is gated rather than assumed.

## After all of this passes

Register one throwaway custom hostname by hand, CNAME a test domain to
`public.myfowable.com`, and confirm the Worker serves it over HTTPS **and** that
`asset.myfowable.com` still serves assets. Only then does the backend work
(automatic hostname registration in `webtree-cms-api`) begin.

## State

`.state/` holds the asset baseline and the created route id. Local only, not
committed. Delete it to start over.
