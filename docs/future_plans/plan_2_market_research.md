# Plan 2 - Market Research, User Complaints, and Differentiation

## Scope
Independent research pass focused on:
- Pakistan-heavy property portals and classifieds
- Regional/global leaders for pattern comparison
- User pain from public reviews and discussions

Primary sources in this pass included publicly accessible Trustpilot pages and portal/public material. Some targets (for example G2/Capterra/Quora in this environment) were partially inaccessible due to anti-bot/rate limits.

## What Users Complain About Most (Cross-Market)

### 1) Fake / Bait Listings
Recurring pattern:
- ad appears available at attractive price
- contact reveals unit is gone
- agent pushes alternate options

Impact:
- trust collapse
- wasted search time
- poor lead quality for serious buyers/tenants

### 2) Stale Inventory and Poor Update Discipline
- old listings remain active
- sold/rented properties still discoverable
- slow or ineffective takedown after reports

### 3) Agent/Lead Funnel Friction
- non-responsive agents
- spam calls after inquiry
- weak routing between user intent and agent expertise

### 4) Safety, Scam, and Payment Anxiety
- deposits/tokens and refund disputes in user narratives
- users feel portal enforcement is weak or opaque

### 5) Weak Filter Reliability
- filters and listing metadata sometimes inconsistent
- map pins/locations and details mismatch reported across markets

## Pakistan and Regional Signals (Accessible Findings)

### Zameen (review-signal themes)
- repeated accusations around fake/old listings and poor post-sale accountability in some reviews
- complaints around support responsiveness and refund/expectation gaps

### Graana (limited volume but notable)
- smaller review volume; includes strong positive early reviews and severe negative investment/refund complaints in recent entries

### OLX Pakistan / classifieds-style usage
- major trust issues: scam attempts, fake buyers/sellers, package upsell dissatisfaction
- classified model has high fraud surface when verification is thin

### Bayut / Property Finder / Dubizzle (regional benchmark signals)
- very similar complaint pattern: bait ads, stale inventory, agent quality inconsistency, moderation trust gap

## Why This Matters for Malkiat
The opportunity is not just "better search relevance." The bigger win is **search + trust + workflow quality** together.

If competitors keep traffic but lose trust, a new entrant can win by making integrity measurable and visible.

## Recommended Differentiators

### A) Listing Integrity Layer (Core Differentiator)
- freshness SLA per listing (expiry + mandatory refresh)
- auto-unpublish if no reconfirmation
- duplicate clustering and suppression
- visible "last verified" and "source confidence" badges

### B) Anti-Bait Enforcement
- strict penalties for repeated bait behavior
- downgrade agent/listing rank when report-confirmed
- repeat-offender throttling/suspension

### C) Contact Quality Controls
- inquiry routing by intent + locality + response history
- response-time score displayed to users
- one-tap "not available / misleading" feedback loop

### D) Transparent Search Interpretation
- show parsed intent/location/filter chips
- let user correct parser decisions quickly

### E) Safer Transaction Journey
- checklist-driven workflow before payment/deposit
- optional milestone/escrow-oriented flow for high-risk interactions
- clear in-product warnings and verification prompts

## Feature Set to Prioritize (Next 2-3 Quarters)
1. Trust score on listing cards (freshness + verification + agent behavior).
2. Report-and-resolve loop with visible resolution outcomes.
3. Saved searches + high-quality alerts (new, price-drop, status-change).
4. Map-first discovery with neighborhood intelligence overlays.
5. Marketplace health dashboard internally (fake rate, stale rate, median response time).

## Metrics That Prove Differentiation
- fake/bait report rate per 1,000 listings
- stale listing ratio
- median time to mark unavailable after signal
- contact-to-visit and visit-to-deal conversion
- trust NPS for search/discovery journey

## Implementation Tie-In to Plan 1
This research reinforces Plan 1 priorities:
- two-index model (`listings` + `places`) for better local intent
- deterministic parser + transparent chips
- ranking that includes trust/freshness/media quality
- moderation outcomes as ranking feedback

## Execution Notes / Constraints
- Some review platforms were inaccessible from this environment due to anti-bot and rate limits.
- Additional scraping from blocked sources should be done via approved API access or manual export to avoid compliance issues.

## Bottom Line
Most competitors are strong at inventory volume and marketing reach, but weak at trustworthy discovery consistency. Malkiat can win by making listing quality, freshness, and safety first-class product primitives instead of backend cleanup tasks.
