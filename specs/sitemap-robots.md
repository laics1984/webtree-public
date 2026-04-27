# Sitemap and Robots Spec

## robots.txt
Use site-level robots defaults where applicable.

## sitemap.xml
Source route data from:
GET /api/public/routes?host={host}

## Rules
- include published public routes
- exclude or skip noindex pages
- use canonical host in generated URLs where appropriate
