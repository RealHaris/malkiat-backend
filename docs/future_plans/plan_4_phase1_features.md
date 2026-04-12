# Plan 4 - Phase 1 Feature Set (Months 1–6)

> Goal: Launch a trust-first property discovery platform that is meaningfully better than Zameen on quality, not just inventory. Win early adopters among serious buyers, renters, and verified agents.

---

## Strategic North Star for Phase 1

**Malkiat Phase 1 = "The portal that doesn't waste your time."**

Every Phase 1 feature should answer this question: *Does this help a serious buyer/renter find a real, available, accurately described property faster than the alternative?*

---

## Phase 1 Feature Modules

### Module 1: Core Search & Discovery (Foundation — Already Started)

**Status:** Backend partially built. Needs extension and trust integration.

#### 1.1 — Enhanced Full-Text + Semantic Search

- Hybrid keyword + vector search (Typesense — already live)
- Deterministic query parser:
  - Geo entity resolution (city → zone → society → phase → block)
  - Intent extraction: `buy`, `rent`, `invest`
  - Property type normalization
  - Price/area/bed-bath constraint extraction
  - Residual free-text passed to semantic layer
- Transliteration: Urdu romanization → normalized aliases (`gulberg` = `gلبرگ` = `gulberg i/ii/iii`)
- Query explain payload: return parsed chips to frontend for user editing
- Multi-area filtering (e.g., "DHA Phase 5 or 6, Lahore")

#### 1.2 — Places Index

- Launch `places` Typesense collection (as described in Plan 1):
  - Country → City → Zone → Sub-zone → Society → Phase/Block/Building
  - Aliases and alternate spellings per node
  - Popularity score for ranking suggestions
- Power auto-complete / location suggestion bar
- Geo-bounding filter integration with listings search

#### 1.3 — Faceted Browse (Discovery Mode)

- Pre-built filter chips: city, property type, price range, beds, intent
- Facet counts update on every filter change
- Map + list synchronized view
- Save search + create alert (email initially)

#### 1.4 — Listing Detail Page

- Full property info: title, description, price, area, beds/baths, address
- Image gallery (with image count badge)
- Video tour embed (YouTube/direct upload link)
- Floor plan image support
- Key attributes display (corner plot, park facing, furnished, etc.)
- Listing freshness indicator: "Listed X days ago · Refreshed Y days ago"
- Trust badge zone (verified badge, agent quality score — built in Module 3)
- Contact agent (WhatsApp CTA + in-app inquiry form)
- Report this listing (one-tap)
- Similar listings carousel
- Share listing (copy link, WhatsApp share)

---

### Module 2: Listings Management (Agent/Owner Facing)

**Status:** Create/Update/Delete commands exist. Need to build out the full agent workflow.

#### 2.1 — Listing Creation Wizard

- Step-by-step guided form (not a single long form):
  1. Basic: intent (sell/rent), property type, price
  2. Location: city, zone, society selector (powered by places index)
  3. Details: beds, baths, area (marla/sqft/kanal selector)
  4. Features: multi-select chips (corner, park facing, furnished, garage, etc.)
  5. Media: image upload (min 3 required), video link, floor plan
  6. Description: AI-assisted description generator (optional)
  7. Review + publish
- Draft save at every step
- Listing quality score shown in real time as form is filled
- Quality gating: minimum photos + complete location required before publish

#### 2.2 — Listing Freshness System

- Every published listing gets a freshness expiry (default: 30 days configurable by property type)
- 7-day warning email/notification: "Refresh your listing to keep it active"
- Agent one-click refresh (confirms availability) → resets freshness timer
- Auto-unpublish on expiry with re-activation CTA
- Frontend displays "Last refreshed X days ago" on all cards

#### 2.3 — Media Management

- Image uploader: drag-and-drop, reorder, set cover image
- Image compression and CDN delivery
- Watermarking option for agent branding
- Video link embed (YouTube, Google Drive, direct MP4)
- Floor plan image (separate upload slot)
- 360° tour embed link (Matterport, etc.)

#### 2.4 — Listing Dashboard (Agent)

- My Listings table: status (draft/published/archived/expired), views, inquiries, last refreshed
- Filter by status, performance
- Bulk refresh / bulk archive actions
- Quick edit inline (price, availability flag)

---

### Module 3: Trust & Verification Layer

**Status:** Not yet built. This is a core differentiator.

#### 3.1 — Listing Trust Score

Each listing gets a computed trust score (0–100) displayed on cards and detail pages, composed of:

| Signal | Weight |
|---|---|
| Freshness (days since last refresh) | 25% |
| Media completeness (photos, video, floor plan) | 20% |
| Location specificity (geo coordinates available) | 15% |
| Agent verification level | 20% |
| Report history (clean = higher score) | 20% |

Display: color-coded badge (green/yellow/red) on listing cards.

#### 3.2 — Agent Verification Tiers

| Tier | Requirements | Badge |
|---|---|---|
| Unverified | Account created | None |
| Basic | Phone verified, CNIC on file | ✓ Verified |
| Professional | Agency affiliation confirmed, listings audited | ★ Professional |
| Elite | 6+ months, low report rate, high response score | ◆ Elite Agent |

- Verification documents uploaded and reviewed by admin
- Tier shown on listing card and agent profile
- Higher tier = higher ranking in search results

#### 3.3 — Report & Moderation Loop

- One-tap report button on every listing
- Report reasons: "No longer available", "Price mismatch", "Fake listing", "Wrong location", "Other"
- Report status shown to reporter: "Under review" → "Resolved" or "Dismissed"
- High-report listings temporarily suppressed from search pending review
- Repeat offender logic: 3+ confirmed reports → listing paused, agent notified

#### 3.4 — Listing Deduplication

- Image hash comparison on upload (perceptual hashing)
- Title + address fuzzy matching for near-duplicate detection
- Flag suspected duplicates to admin dashboard
- Agent warned on suspected duplicate submission

---

### Module 4: User Experience & Accounts

#### 4.1 — User Profiles

- Buyer/renter profile: saved searches, saved listings, inquiry history
- Agent/owner profile: listings, reviews received, response rate, contact info
- Profile photo + bio (agent)
- Public agent page: all their active listings + stats

#### 4.2 — Saved Searches & Alerts

- Save any active search configuration
- Alert triggers:
  - New listing matching saved search
  - Price drop on saved listing
  - Status change (re-listed, price changed, sold/rented)
- Alert channels: email (Phase 1), push notification (Phase 2)
- Alert frequency settings: instant / daily digest / weekly

#### 4.3 — Inquiry Management

- In-platform inquiry form (not just WhatsApp)
- Inquiry routed to agent's dashboard
- Agent response via in-platform message or WhatsApp
- Response time tracking (shown on agent profile)
- "Not available" quick response closes inquiry + marks listing for review
- Inquiry history for buyer (track all inquiries in one place)

#### 4.4 — Onboarding Flows

- Guest browse: full search/discovery without account
- Account required only for: saving, inquiring, listing
- Agent onboarding: guided 5-step setup (profile → listings → verification)
- Email verification required before first listing publishes

---

### Module 5: Location Intelligence (Neighborhood Data — Phase 1 MVP)

**Status:** Not built. High differentiation value, no competitor in Pakistan has this.

#### 5.1 — Society / Area Profile Pages

- Dedicated page for major housing societies and zones (DHA Lahore, Bahria Town, etc.)
- Content: overview, typical price range, nearby amenities checklist
- Active listing count + average price in this area
- Linked from listing detail page ("More in DHA Phase 6")

#### 5.2 — Nearby Amenities Display

- On listing detail: show nearby hospitals, schools, mosques, markets, parks, public transport
- Data source: OpenStreetMap (free) or manual entry per city
- Distance labels: "0.5km from Shaukat Khanum Hospital"

#### 5.3 — Price Trends (Basic)

- Area-level median asking price per month chart (6-month window)
- Shown on society profile page and listing detail page
- Data derived from own listing history (no third-party required)

---

### Module 6: Admin & Operations Tools

#### 6.1 — Admin Dashboard

- Listing moderation queue (reports, dedup flags, quality-gate failures)
- Agent verification queue
- Platform health metrics: total listings, published/draft/expired, fake report rate, median freshness
- User management: search, ban, role assignment

#### 6.2 — Platform Health Metrics

Internal dashboard tracking:
- Fake/bait report rate per 1,000 listings
- Stale listing ratio
- Median time to mark unavailable after report
- Agent response rate
- Zero-result search rate

---

## Phase 1 Technical Backlog (Priority Order)

> 🔴 = Critical (launch blocker) | 🟠 = High | 🟡 = Medium

1. 🔴 Places index schema + ingestion worker (Plan 1, Item 1)
2. 🔴 Query parser service in listing-discovery (Plan 1, Item 2)
3. 🔴 **Listing Quality Score system — rule-based 0–100** (see Plan 9 for full spec)
   - Hard publish gates (min 3 photos, required fields)
   - Photo count score, attribute completeness score, media richness
   - Quality badge on listing cards (Platinum/Gold/Standard/Poor)
   - Ranked improvement tips in agent dashboard
4. 🔴 **FeedScore blended ranking** — integrate Quality + Trust + Freshness + Boost signals (see Plan 8)
5. 🔴 **In-portal inquiry form + agent response tracking** (see Plan 10 for full spec)
   - Structured inquiry submission (not just WhatsApp redirect)
   - Response time computation worker (BullMQ, rolling 90-day avg)
   - Response Score (0–100) stored per agent + shown publicly
   - "No longer available" quick-close action
6. 🔴 Extend listings index with trust/freshness fields (Plan 1, Item 3)
7. 🔴 Listing freshness expiry system (cron + BullMQ job)
8. 🟠 Image upload + CDN integration
9. 🟠 **Filter system — 9 categories, 40+ filters** (see Plan 8 filter section)
10. 🟠 **Cold start boost for new listings** (48h automatic +0.20 score bonus)
11. 🟠 Trust score computation worker
12. 🟠 Report submission API + moderation queue
13. 🟠 Agent verification document upload + review flow
14. 🟠 Saved searches + alert email pipeline (percolation pattern — see Plan 8)
15. 🟠 Agent online status computation (Active Today / Away — derived from activity timestamp)
16. 🟠 Buyer "My Inquiries" history page
17. 🟡 Society/area profile pages (static + dynamic)
18. 🟡 Admin dashboard (internal)
19. 🟡 GPS coordinate map pin on listing creation form

---

## Phase 1 Success Metrics

| Metric | Target |
|---|---|
| Fake/bait report rate | < 5 per 1,000 published listings |
| Stale listing ratio | < 10% listings older than 30 days without refresh |
| Inquiry response rate | > 60% of inquiries answered within 24h |
| Zero-result search rate | < 8% |
| Verified agent ratio | > 40% of active agents at Basic+ tier |
| Save-search-to-return visits | > 30% of users with saved searches return within 7 days |

---

## Phase 1 Out of Scope (Deferred to Phase 2)

- Mortgage calculator integration with live bank rates
- Short-term rental vertical
- Developer project microsite
- Agent CRM (lead pipeline, WhatsApp automation)
- AI property valuation (Zestimate equivalent)
- NRP / overseas buyer workflow
- Payment gateway / token booking
- Conversational AI search
- Push notifications (mobile app)
- Neighborhood safety/school ratings (beyond basic amenities)
