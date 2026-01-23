# Discovery and Search

This document describes the public-facing "discovery" and "search" capabilities for listings.

Discovery and search endpoints are intended to be publicly accessible (anonymous) so the app can render browse pages without requiring a session.

## Discovery (Browse)

Discovery is optimized for browsing and merchandising.

Typical features:

- Browse latest/newest listings
- Browse by location (city/area) and/or property type
- Browse by listing status (normally only `PUBLISHED`)
- Basic sorting (newest, price low->high, price high->low)

Suggested response shape (example):

- `items`: array of listing cards (id, title, price, currency, location summary, primary media)
- `page` / `limit` (or cursor)
- `total` (optional if using cursor)

## Search (Query)

Search is optimized for intent-based queries.

Typical features:

- Free-text query across title/description
- Filters: price range, bedrooms/bathrooms, property type, area, currency
- Sorting: relevance, newest, price
- Pagination: cursor (preferred) or page/limit

Suggested response shape (example):

- `items`: array of results
- `facets`: optional buckets (propertyType, price ranges, etc.)
- `nextCursor`: when using cursor pagination

## Auth / Access

- Discovery and search endpoints should be marked anonymous (no auth required).
- All write/admin listing endpoints remain authenticated and role-restricted.

In this codebase, anonymous access is achieved by decorating controllers/routes with:

- `@AllowAnonymous()` from `@thallesp/nestjs-better-auth`

## Implementation Notes (Current State)

- Listing read model / query handlers are not implemented yet.
- Current listing module only includes command-side handlers (create/update/delete) and DTO validation.
- When implementing discovery/search, prefer CQRS query handlers and a dedicated read model.
