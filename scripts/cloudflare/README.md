# Cloudflare custom-domain setup

Operational scripts for putting client custom domains onto this Worker via
Cloudflare for SaaS. Run once, in order, by a human with zone access.

A client domain reaches this Worker only when **both** of these are true:

1. it is registered as a **custom hostname** on the `myfowable.com` zone, and
2. a **Worker route matches it**.

The API does (1) automatically — see `EntityDomainService` and
`DomainConnectionReconciler` in `webtree-cms-api`. These scripts do (2), plus the
zone-level prerequisites that registration depends on.

## Why the route is zone-wide

Worker routes are evaluated against the **request URL**, not the fallback origin.
A request for `clientdomain.com` arrives with that hostname, so
`*.myfowable.com/*` can never match it however the traffic got here. The
route has to be `*/*`.

That is safe here only because nothing else on this zone needs a different
origin:

| Hostname | Served by |
|---|---|
| `*.myfowable.com` | this Worker (tenant sites) |
| `myfowable.com` | this Worker (fallback origin; never actually contacted) |
| any registered custom hostname | this Worker |

> ⚠️ **Adding any other hostname to this zone will silently route it here.**
> Run `./01-audit.sh` before you do. If it needs a different origin — an R2
> custom domain, a redirect, another service — put it on a different zone.

Assets used to make this hard: `asset.myfowable.com` was an R2 custom domain on
*this* zone, and a route takes precedence over an R2 custom domain on the same
hostname. They now serve from `asset.fowable.com` on the `fowable.com` zone,
out of reach of any `myfowable.com` route. `server/middleware/assetHost.ts` 301s
anything still asking for the old host, so cached and hard-coded URLs keep
working.

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
| Zone → DNS | Edit |
| Zone → Workers Routes | Read |
| Zone → SSL and Certificates | Edit |

The token is passed as a header and is never printed or written to disk. This is
**not** the token the API uses at runtime — mint that one separately with only
`Zone → SSL and Certificates: Edit`, since all it ever does is manage custom
hostnames.

## Run order

> **`myfowable.com` is production.** There is no staging zone. Scripts marked
> "changes anything" write to the live zone and require typing `yes`.

| | Script | Changes anything? | What it does |
|---|---|---|---|
| 1 | `01-audit.sh` | no | Lists every proxied hostname the `*/*` route captures, plus existing routes, the CNAME target, the platform records and the fallback origin. |
| 2 | `fix-platform-wildcard.sh` | **yes** | Creates the two proxied placeholder records: `*.myfowable.com` (tenant sites resolve) and `myfowable.com` (fallback origin can be set). |
| 3 | *(deploy the `*/*` route)* | **yes** | Already in `wrangler.jsonc`; merging to `master` is what makes it live. |
| 4 | `05-fallback-origin.sh` | **yes** | Designates `myfowable.com` as the Cloudflare for SaaS fallback origin. Needs Cloudflare for SaaS enabled on the account first. |

### Before step 3

Assets must already be serving from `asset.fowable.com` — check the network tab
on a live client site and on the admin app. `AWS_URL` on the API and
`VITE_ASSET_PUBLIC_URL` in the admin app's deploy workflow are the two knobs.
Deploying `*/*` while anything still fetches `asset.myfowable.com` directly means
every one of those requests takes a redirect hop instead of hitting the bucket.

### Why `myfowable.com` needs its own record

A DNS wildcard never answers for its own parent name, so
`*.myfowable.com` leaves the bare `myfowable.com` unresolvable.
`05-fallback-origin.sh` refuses to run without a proxied record for it, and
Cloudflare will not accept custom hostnames on a zone with no valid fallback
origin. `fix-platform-wildcard.sh` creates both.

The fallback origin is a formality here: the Worker intercepts before origin
resolution, so `192.0.2.0` is never contacted. It still has to exist.

It also cannot point at `fowable.com` — Cloudflare requires the fallback origin
to be a hostname on the same zone as the custom hostnames.

## After all of this passes

Register one throwaway custom hostname by hand, CNAME a test domain to a tenant
platform host, and confirm the Worker serves it over HTTPS. That is what proves
Error 1014 is gone. Only then point the API at the zone by setting
`CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ZONE_ID`.

## If a client domain 1014s after all this

`1014` means Cloudflare saw a CNAME into a zone it does not think owns that
hostname — i.e. the custom hostname is not registered. Check, in order:

1. the hostname exists under SSL/TLS → Custom Hostnames in the dashboard
2. its status is `active`, not `pending` or `blocked`
3. `entity_custom_hostnames.cloudflare_id` is populated for that host in the API
4. `php artisan domains:reconcile --entity=<token>` to force a refresh

## State

`.state/` is local only and not committed. Delete it to start over.
