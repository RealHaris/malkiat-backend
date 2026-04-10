# Plan 1 - Search Architecture and Product Foundations

## Goal
Build a location-first, trust-first property discovery platform on top of the current NestJS + CQRS backend (`Postgres + Drizzle` write model, `Typesense` read model, `Redis/BullMQ` async pipeline).

## Current Baseline (Already in Repo)
- Public discovery/search endpoints exist in `listing-discovery`.
- `TypesenseListingsSearch` currently supports:
  - keyword + vector hybrid query on `title,description,embedding`
  - filters: `status`, `propertyType`, `currency`, `minPrice`, `maxPrice`
  - sort: relevance/newest/price
- Single `listings` Typesense collection is active.
- Event-driven indexing path is in place through BullMQ worker.

## Product Direction
- Prioritize **high-intent local search** over generic keyword search.
- Treat **trust and freshness** as ranking primitives (not add-ons).
- Make parsing transparent in UI (intent chips users can edit).

## Target Search System

### 1) Two-Index Strategy
- `listings` index: listing-level searchable inventory.
- `places` index: geography hierarchy and aliases (country -> city -> zone -> phase/block/building).

### 2) Deterministic Query Understanding Pipeline
For each query, run these steps in order:
1. Normalize text (case, punctuation, transliteration aliases).
2. Resolve geo entities through `places` (including aliases and local spellings).
3. Extract structured constraints:
   - intent (`buy`, `rent`)
   - property type
   - price range
   - beds/baths/area
   - features (`corner`, `park facing`, etc.)
4. Create residual free-text query for semantic relevance.
5. Build query plan:
   - strict filters from parsed constraints
   - geo filter from place resolution
   - hybrid text/vector relevance on residual text

### 3) Ranking Model (Practical v1)
Final score should blend:
- textual relevance
- semantic similarity
- freshness
- trust/verification
- media completeness
- responsiveness signals (agent response speed)
- optional marketplace boosts (clearly labeled, capped)

### 4) Trust and Integrity Controls
- Deduplicate near-identical listings by image/hash + title/address heuristics.
- Penalize stale inventory automatically.
- Add report/feedback loop and feed moderation outcomes back into ranking.
- Distinguish verified listings and verified agents with explicit badges.

## Data Design

### `listings` (read model additions)
- `listingId`, `ownerId`, `status`, `intent`, `propertyType`
- `priceAmount`, `currency`
- `bedrooms`, `bathrooms`, `area`, `areaUnit`
- `locationText`, `city`, `zone`, `subzone`, `building`
- `lat`, `lng` (if available)
- `verificationLevel`, `qualityScore`, `freshnessScore`
- `createdAt`, `updatedAt`, `publishedAt`
- `embedding`

### `places` (new)
- `placeId`, `name`, `type`, `parentId`
- `aliases[]`, `lang`, `slug`
- `lat`, `lng`, optional polygon/bounds reference
- `popularityScore`

## API Evolution
- Keep existing endpoints stable.
- Add optional explain metadata for frontend chips:
  - parsed location
  - parsed filters
  - rewritten residual query
- Add facet response blocks for better browse UX.

## Frontend UX Requirements
- Map + list synchronized view.
- Editable chips for parsed filters.
- Fast reset/undo for chips.
- Save search + alerts (email/push/in-app).
- Clear trust signals on cards (verified, refreshed, agent quality).

## Rollout Plan

### Phase 0 - Foundations
- Add telemetry around query types and zero-result patterns.
- Version current ranking and response payloads.

### Phase 1 - Location Intelligence
- Launch `places` index and query parser for geo entities.
- Support multi-area filtering and alias resolution.

### Phase 2 - Trust + Quality
- Add dedup, staleness penalties, and listing quality scoring.
- Add verification metadata and expose in UI.

### Phase 3 - Relevance Optimization
- Tune weighted ranking with online metrics.
- Add query rewrite rules from failure logs.

## Success Metrics
- Search-to-contact conversion rate.
- Zero-result rate.
- Time-to-first-meaningful-result.
- Reported fake/stale listing rate.
- Repeat search sessions and alert retention.

## Immediate Engineering Backlog (Repo-Ready)
1. Introduce `places` schema + ingestion worker.
2. Add parser service in `listing-discovery` before Typesense query construction.
3. Extend `listings` index fields for trust/freshness.
4. Add explain payload in search response for UI chips.
5. Add metrics events for parse success, zero results, and result engagement.
