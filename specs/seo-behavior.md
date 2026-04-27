# Public SEO Behavior Spec

## Purpose
Define how page metadata should be rendered.

## Required tags
- title
- meta description
- canonical
- robots
- og:title
- og:description
- og:image
- twitter card tags
- favicon

## Structured data
- render JSON-LD when provided
- do not emit malformed JSON-LD

## Host/canonical behavior
- renderer uses current host for request
- canonical should respect backend-provided canonical URL
