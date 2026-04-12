# Plan 7 - Master Roadmap & Strategic Overview

> Single-page view of where Malkiat is going, what we're building, and in what order.
> Cross-references: Plan 1 (Search Architecture), Plan 2 (Market Research), Plan 3 (Competitive Analysis), Plan 4 (Phase 1 Features), Plan 5 (Phase 2 Features), Plan 6 (Monetization).

---

## The Opportunity in One Sentence

Pakistan's real estate market is a ~$1.5 trillion economy with no trustworthy, end-to-end digital platform — Malkiat can own that layer.

---

## What We're Building

```
Malkiat = Trust-first property marketplace + Agent SaaS + Vertical real estate services
```

**Three distinct product layers:**

| Layer | What It Is | Revenue |
|---|---|---|
| **Consumer Marketplace** | Search, discover, and inquire about properties | Indirect (drives B2B demand) |
| **B2B SaaS (Agent/Agency)** | CRM, listing management, boosts, analytics | Subscriptions + credits |
| **Vertical Services** | STR, home finance, NRP inspections, developer campaigns | Commissions + referrals |

---

## Positioning Statement

> Malkiat is the property platform where listings are real, agents are accountable, and every serious buyer or renter wastes zero time.

**Against Zameen:** Higher trust, lower fraud, better search intent parsing.
**Against standalone CRMs (Aiksol360, Broker92):** Full-stack (portal + CRM), lower cost, better leads because they come from the same platform.
**Against Airbnb/OYO for STR:** Local-first, PKR-denominated, JazzCash/EasyPaisa native.

---

## Roadmap Timeline

### Phase 0 — Foundation (Complete / In Progress)

**What's done:**
- NestJS + CQRS + DDD architecture
- PostgreSQL write model + Typesense read model
- BullMQ event pipeline
- Better Auth (email/password + Google + Apple OAuth)
- Basic listing CRUD (create/update/delete)
- Basic search and discovery endpoints
- Role-based access (admin/agent/user)
- Agency module (initial)

**What's in progress:**
- Search architecture improvements (Plan 1: places index, query parser, trust/freshness fields)

---

### Phase 1 — "The portal that doesn't waste your time" (Months 1–6)

**North Star:** Win serious buyers and renters with a discovery experience that is measurably more trustworthy than Zameen.

**Key deliverables:**

```
┌─────────────────────────────────────────────────────────┐
│  Search & Discovery                                      │
│  ├── Places index (geo hierarchy + aliases)              │
│  ├── Deterministic query parser (intent, location, size) │
│  ├── Query explain chips (editable by user)              │
│  ├── Map + list synchronized view                        │
│  └── Save search + email alerts                          │
│                                                          │
│  Listing Management                                      │
│  ├── Guided creation wizard (step-by-step)               │
│  ├── Image upload + CDN                                  │
│  ├── Listing freshness expiry system (30-day SLA)        │
│  ├── Real-time quality score in form                     │
│  └── Agent listing dashboard                             │
│                                                          │
│  Trust Layer                                             │
│  ├── Trust score on listing cards (0–100)                │
│  ├── Agent verification tiers (Basic → Elite)            │
│  ├── Report + moderation loop                            │
│  └── Duplicate detection (image hash + fuzzy match)      │
│                                                          │
│  User Accounts                                           │
│  ├── Buyer/renter profile + saved listings               │
│  ├── Inquiry management (in-platform form + routing)     │
│  ├── Agent public profile (listings, response rate)      │
│  └── Onboarding flows                                    │
│                                                          │
│  Neighborhood (MVP)                                      │
│  ├── Society/area profile pages                          │
│  ├── Nearby amenities display (OpenStreetMap)            │
│  └── Basic price trends chart                            │
│                                                          │
│  Quality Ranking System (NEW — Plan 9)                   │
│  ├── Listing Quality Score 0–100 (rule-based, Phase 1)   │
│  ├── Hard publish gates (min 3 photos, required fields)  │
│  ├── Quality badge on listing cards (Platinum/Gold/etc.) │
│  ├── Ranked improvement tips in agent dashboard          │
│  └── Quality Score as 25% weight in FeedScore            │
│                                                          │
│  Feed Algorithm (NEW — Plan 8)                           │
│  ├── FeedScore = Relevance+Quality+Trust+Freshness+Boost │
│  ├── Discovery feed (personalized, location-aware)       │
│  ├── Search results feed (relevance-first re-ranking)    │
│  ├── Saved search alert feed (percolation pattern)       │
│  ├── Cold start boost for new listings (48h window)      │
│  ├── Filter system — 9 categories, 40+ filter options    │
│  └── Anti-gaming rules (agent cap, boost ceiling, floor) │
│                                                          │
│  Agent Availability & In-Portal Contact (NEW — Plan 10)  │
│  ├── In-portal inquiry form (structured, async)          │
│  ├── Agent response time tracking (rolling 90-day avg)   │
│  ├── Response Score 0–100 displayed publicly             │
│  ├── Agent online status (Online Now/Active Today/Away)  │
│  ├── "No longer available" quick-close action            │
│  └── Buyer "My Inquiries" history + 24h nudge            │
│                                                          │
│  Admin                                                   │
│  ├── Moderation queue (reports, dupes, quality fails)    │
│  ├── Agent verification queue                            │
│  └── Platform health metrics dashboard                   │
└─────────────────────────────────────────────────────────┘
```

**Monetization unlocked in Phase 1:**
- Agent subscriptions (Free + Starter tiers)
- Listing boost credits (Hot, Refresh)

**Phase 1 success signal:** 1,000+ published listings in 3 cities, fake/bait report rate < 5 per 1,000, 200+ active agents.

---

### Phase 2 — "The operating system for Pakistan real estate" (Months 7–18)

**North Star:** Win agents, agencies, and developers as paying B2B customers. Open new revenue verticals that don't exist in the Pakistan market today.

**Key deliverables:**

```
┌─────────────────────────────────────────────────────────┐
│  Agent CRM & Agency SaaS                                 │
│  ├── Lead inbox (email + WhatsApp + in-platform)         │
│  ├── Lead pipeline (New → Closed)                        │
│  ├── SmartLeads™ (behavior-based preference analysis)    │
│  ├── WhatsApp Business integration                       │
│  ├── Agency management portal (teams, quotas, billing)   │
│  ├── Commission tracking                                 │
│  └── Listing boost marketplace (credits + bundles)       │
│                                                          │
│  Developer Projects                                      │
│  ├── Developer profile + project microsites              │
│  ├── Payment plan tables + progress tracking             │
│  ├── Approval badge (NOC/CDA/LDA verification)           │
│  └── Developer lead capture + analytics                  │
│                                                          │
│  AI Features                                             │
│  ├── Conversational/NLP search (English + Urdu)          │
│  ├── AI property valuation (Malkiat Estimate)            │
│  ├── AI listing description generator                    │
│  ├── AI lead qualification scoring                       │
│  └── Smart property recommendations                      │
│                                                          │
│  Home Finance                                            │
│  ├── Mortgage calculator (conventional + Islamic)        │
│  ├── Finance eligibility estimator                       │
│  ├── Bank partner lead referral pipeline                 │
│  └── Finance content hub (guides + government schemes)   │
│                                                          │
│  Short-Term Rental Vertical                              │
│  ├── STR listing type + booking engine                   │
│  ├── Calendar availability + instant book                │
│  ├── JazzCash / EasyPaisa payment integration            │
│  ├── Host dashboard (earnings, reviews, multi-property)  │
│  └── Guest trust features (CNIC verify, property badge)  │
│                                                          │
│  NRP / Overseas Buyer Workflow                           │
│  ├── NRP search mode (verified listings + projects only) │
│  ├── Remote site inspection service                      │
│  ├── Cross-border payment support (Roshan DA)            │
│  └── NRP legal resource center                           │
│                                                          │
│  Neighborhood Intelligence (Full)                        │
│  ├── Neighborhood score (schools, health, safety, etc.)  │
│  ├── Commute calculator (Google Maps API)                │
│  └── Price vs neighborhood comparison                    │
│                                                          │
│  Mobile App                                              │
│  ├── iOS + Android native apps                           │
│  ├── Push notifications                                  │
│  ├── Camera-first listing creation                       │
│  └── Agent app (CRM on mobile)                           │
└─────────────────────────────────────────────────────────┘
```

**Monetization unlocked in Phase 2:**
- Agent Professional + Elite subscriptions
- Agency Team + Business plans
- Developer campaign fees
- STR booking commission
- NRP inspection service fees
- Home finance referral commissions
- Display advertising
- Data & market reports

**Phase 2 success signal:** PKR 5M+ MRR, 500+ paying agents, 20+ developer campaigns, 500+ monthly STR bookings.

---

### Phase 3 — "The marketplace that closes deals" (Months 18–36)

**North Star:** Own the transaction layer. Move from being a discovery platform to being the platform where deals actually happen.

**Planned capabilities:**

- **Token booking / digital earnest money:** Online token payment (held in escrow) for serious buyer intent; reduces agent time on tire-kickers
- **Digital property agreements:** E-signing of sale agreements, rent agreements, token receipts via DocuSign/local equivalent
- **In-platform negotiation room:** Structured offer/counter-offer between buyer and seller with timeline and audit trail
- **Legal document vault:** Upload/store/share legal documents (fard, registry, mutation) securely per property
- **Verified title chain:** Integration with PLRA (Punjab Land Records Authority) and city land records for digital ownership chain display
- **Mortgage origination:** Move from referral to origination — partner with banks to process mortgage applications entirely in-platform
- **Post-transaction services marketplace:** Connect buyers/renters with movers, interior designers, utility setup, cleaning services (Airbnb-experiences model)
- **Fractional investment:** Allow multiple investors to co-own listed properties through a Reg-compliant structure (Pakistan-specific regulations apply)
- **Enterprise API:** Sell Malkiat data, listings, and services to banks, NBFIs, government housing authorities

---

## Pain Points We're Solving — Priority & Urgency Order

> Urgency: 🔴 Critical (launch blocker) | 🟠 High (major differentiator) | 🟡 Medium (phase 2 value-add)

| # | Pain Point | Urgency | Phase | Plan Reference |
|---|---|---|---|---|
| 1 | Fake / bait listings destroying trust | 🔴 Critical | Phase 1 — Trust Score + Verification | Plan 2, Plan 4 |
| 2 | **Poor listing quality: bad photos, incomplete fields** | 🔴 Critical | Phase 1 — Quality Score system (0–100) | **Plan 9** |
| 3 | **Agent unavailability: WhatsApp-only → ignored inquiries** | 🔴 Critical | Phase 1 — In-portal inquiry + response tracking | **Plan 10** |
| 4 | Stale inventory wasting search time | 🔴 Critical | Phase 1 — Freshness SLA + Auto-unpublish | Plan 2, Plan 4 |
| 5 | **Feed shows irrelevant / poor listings first** | 🔴 Critical | Phase 1 — FeedScore blended ranking system | **Plan 8** |
| 6 | Filters and location data mismatch | 🟠 High | Phase 1 — Places index + query parser + 9 filter categories | Plan 1, Plan 8 |
| 7 | No way to verify agent quality / responsiveness | 🟠 High | Phase 1 — Agent tiers + response rate score (public) | Plan 4, Plan 10 |
| 8 | No CRM: agents juggle WhatsApp + portal separately | 🟠 High | Phase 2 — Native CRM + unified lead inbox | Plan 5 |
| 9 | No safe payment pathway for token/deposit | 🟠 High | Phase 2 — Escrow integration / Phase 3 native | Plan 5, Plan 7 |
| 10 | NRPs can't transact remotely with confidence | 🟠 High | Phase 2 — NRP workflow | Plan 5 |
| 11 | No neighborhood data for informed decisions | 🟡 Medium | Phase 1 MVP → Phase 2 full | Plan 4, Plan 5 |
| 12 | No local Airbnb for short stays | 🟡 Medium | Phase 2 — STR vertical | Plan 5 |
| 13 | Developer project opacity (no progress tracking) | 🟡 Medium | Phase 2 — Developer microsites | Plan 5 |
| 14 | No mortgage guidance or tools | 🟡 Medium | Phase 2 — Finance hub | Plan 5 |

---

## Technology Bets

| Technology | Why |
|---|---|
| **Typesense** | Open-source, fast, self-hosted, vector + keyword hybrid — perfect for property search |
| **BullMQ + Redis** | Reliable async pipeline for indexing, notifications, expiry jobs |
| **PostgreSQL + Drizzle** | ACID writes, full type safety, great DX |
| **Better Auth** | Modern auth with OAuth — avoids Cognito/Auth0 complexity and cost |
| **OpenAI API** | GPT-4o for AI description generator, conversational search, lead scoring |
| **JazzCash / EasyPaisa** | Essential for Pakistan mobile payment adoption (STR bookings, credit purchases) |
| **OpenStreetMap / Overpass API** | Free neighborhood amenity data without Google Maps cost |
| **Google Maps Distance Matrix** | Commute calculator (cost-effective, accurate) |

---

## What Not to Build (Intentionally Out of Scope)

| Thing | Reason |
|---|---|
| Own construction projects (like Zameen Opal) | Capital intensive, not a software business |
| Property management operations | Physical, doesn't scale as SaaS |
| Own brokerage / in-house agents | Conflicts with agent-customer relationship |
| Horizontal classifieds (OLX model) | Trust dilution, wrong focus |
| International expansion (Phase 1–2) | Pakistan market is deep enough; premature expansion kills focus |

---

## Key Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Zameen retaliates with identical features | Speed and trust quality are the moat — ship fast, ship cleanly |
| Agent adoption slower than expected | Credits model lets agents try with PKR 800 before subscribing |
| Inventory chicken-and-egg problem | Seed with 3 cities; focus on quality over quantity |
| Pakistan payment infrastructure friction | JazzCash + EasyPaisa first; international card as secondary |
| AI model training data scarcity (valuation) | Build valuation tool after 12+ months of proprietary listing data |
| NRP inspection quality control | Partner network with SLA + spot checks; in-house only in Islamabad initially |
| Regulatory uncertainty (blockchain, fractional) | Delay fractional to Phase 3; get legal opinion before launch |

---

## Document Index

| Document | Contents |
|---|---|
| `plan_1.md` | Search architecture, places index, ranking model |
| `plan_2_market_research.md` | User pain points, Pakistan market research |
| `plan_3_competitive_analysis.md` | Zameen, Bayut, Zillow, Redfin, MagicBricks, CRMs |
| `plan_4_phase1_features.md` | Full Phase 1 feature spec with tech backlog |
| `plan_5_phase2_features.md` | Full Phase 2 feature spec with tech backlog |
| `plan_6_monetization_saas.md` | Revenue streams, pricing tables, SaaS KPIs |
| `plan_7_master_roadmap.md` | This document — strategic overview |
| `plan_8_feed_algorithm_system_design.md` | Feed types, FeedScore formula, filters (40+), refresh triggers, personalization, percolation alerts |
| `plan_9_listing_quality_ranking.md` | Quality Score 0–100, photo AI scoring, attribute completeness, hard publish gates, agent dashboard tips |
| `plan_10_agent_availability_contact.md` | In-portal messaging, response time scoring, availability status, viewing scheduler, AI quick replies |
| `plan_11_launch_strategy_cold_start.md` | Cold start playbook — city-first strategy, WhatsApp outreach, anchor agencies, listing import tool, NRP angle, financial burn rate |
