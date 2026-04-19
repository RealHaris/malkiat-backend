# Plan 8 - Feed Algorithm & System Design

> How the Malkiat listing feed is generated, ranked, refreshed, and personalized — covering the full technical system design from data signals to API response.

---

## Why Feed Design Is a Core Product Decision

The "feed" is the first thing every user sees. It's not just a list of listings — it is the primary trust signal. If the feed shows stale, irrelevant, or low-quality listings, users leave. If it feels personalized and curated, users stay, engage, and convert.

Research from the PropTech industry shows:
- 78% of buyers abandon a platform after just three irrelevant recommendations
- Personalized feeds increase engagement by 35–47% over generic sorted lists
- Listings with high engagement stay visible; low-engagement listings are suppressed (Zillow algorithm behavior)

The Malkiat feed must be designed as a **ranking system**, not a display system.

---

## Three Feed Modes

Malkiat will support three distinct feed modes depending on context:

| Mode | When Used | Ranking Logic |
|---|---|---|
| **Discovery Feed** | Homepage, "Browse" tab | Personalized + ranked by quality + freshness |
| **Search Results Feed** | After a query is submitted | Relevance-first + quality + trust signals |
| **Saved Search Feed** | Alert digest, saved search page | Chronological new listings matching saved criteria |

Each mode uses a different composition of the same underlying signals — they share the scoring infrastructure but weight signals differently.

---

## Feed Signal Architecture

### Signal Categories

Every listed property gets scored across five signal categories. The final feed score is a weighted blend.

```
FeedScore = (RelevanceScore × W1) +
            (QualityScore  × W2) +
            (TrustsScore   × W3) +
            (FreshnessScore× W4) +
            (BoostScore    × W5)
```

#### W1 — Relevance Score (Discovery: 25% | Search: 45%)
How well this listing matches what the user actually wants.
- Keyword/semantic match (Typesense hybrid score)
- Location match (user's searched city/zone vs listing location)
- Intent match (buy/rent vs listing intent)
- Price range proximity (inside range = full score; outside = decayed score)
- Property type match (exact = 1.0, related = 0.5, mismatch = 0)
- Behavioral affinity: user has clicked similar listings → boost

#### W2 — Quality Score (Discovery: 25% | Search: 20%)
How complete and well-presented the listing is.
Full breakdown in Plan 9. Summary factors:
- Photo count and AI photo quality score
- Description length and completeness
- All required fields filled (beds, baths, area, full location)
- Floor plan present
- Video tour present
- Geo coordinates present

#### W3 — Trust Score (Discovery: 20% | Search: 15%)
How trustworthy the listing and agent are.
- Agent verification tier (Elite > Professional > Basic > Unverified)
- Report history (zero reports = max; each confirmed report decays score)
- Listing history: no bait complaints, no unavailability flags
- Duplicate status: suspected duplicate → penalized

#### W4 — Freshness Score (Discovery: 20% | Search: 15%)
How recently active and current the listing is.
- Days since published (decay function: full score day 0 → 50% score day 30 → auto-unpublish)
- Days since last agent refresh (confirms availability)
- Price updates (a price change is a freshness signal — shows agent engagement)
- Recent inquiry activity on the listing (shows it's still relevant)

#### W5 — Boost Score (Discovery: 10% | Search: 5%)
Paid placement premium, clearly labeled to users.
- Hot Credit active → +0.15 boost multiplier
- Featured Credit active → +0.30 boost multiplier (capped; not allowed to outrank Trust < 40)
- Story Credit → separate surface (not in feed ranking, appears in story rail)
- **Hard rule:** Boost cannot elevate a listing above Trust Score threshold. Fake/low-trust listings cannot be boosted to top.

---

## Feed Types in Detail

### 1. Discovery Feed (Homepage / Browse)

**Goal:** Show the most relevant, high-quality, trustworthy listings for this user right now — without requiring them to search.

**Algorithm steps:**

```
1. Identify user context
   ├── Authenticated? → load preference profile (city, budget, type, behavioral history)
   └── Anonymous? → use browser GPS (500m) → IP geo (neighborhood) → city default

2. Candidate retrieval
   ├── Pull listings matching user's city/zone preferences (Typesense filter)
   ├── Exclude: expired, archived, draft, trust < 20 threshold
   └── Cap: retrieve top 500 candidates for scoring

3. Score each candidate
   └── Apply FeedScore formula (W1–W5 with Discovery weights)

4. Apply diversity rules
   ├── Max 3 consecutive listings from same agent
   ├── Max 2 listings for same property address (dedupe)
   └── Inject minimum 10% "discovery" listings: new listings < 48h old (cold start boost)

5. Paginate and return
   ├── Page 1: top 20 by score
   ├── Subsequent pages: continue ranked list
   └── Attach explain metadata: why this listing ranked (for internal monitoring)
```

**Cold Start Problem (new listings):**
New listings have no interaction history (no clicks, no saves, no inquiries). Without a boost, they'd be invisible beneath established listings. Solution:
- New listing boost: automatic +0.20 score bonus for first 48 hours
- Guaranteed minimum exposure: every new published listing appears in at least 500 feed impressions before organic ranking takes over
- Cold start decay: bonus linearly decays from +0.20 → 0 between hour 0 and hour 48

---

### 2. Search Results Feed

**Goal:** Return the most relevant results for the exact query, with quality and trust as tiebreakers.

**Algorithm steps:**

```
1. Parse query (Plan 1 query parser)
   ├── Extract: intent, geo entity, property type, price range, beds/baths, area, features
   └── Build: strict filters + geo filter + semantic residual

2. Typesense query execution
   ├── Apply all strict filters (city, zone, type, price range, intent, status=PUBLISHED)
   ├── Execute hybrid keyword + vector search on residual text
   └── Retrieve top 200 by Typesense relevance

3. Re-rank with FeedScore (Search weights)
   └── Blend Typesense relevance score + quality + trust + freshness + boost

4. Surface query chips
   └── Return parsed intent/location/filters for frontend display (editable by user)

5. Return facets
   └── Price distribution, property type counts, city/zone counts for filter sidebar
```

---

### 3. Saved Search Feed / Alert Feed

**Goal:** Show only new, real, matching listings since the user's last visit or last alert.

**Algorithm — Elasticsearch Percolation Pattern:**

Inspired by realestate.com.au's approach (4.6M saved searches, millions of notifications daily):

```
1. When a listing is PUBLISHED or UPDATED:
   ├── Emit a "listing.published" or "listing.updated" event via BullMQ
   └── Worker receives event

2. Worker: percolate listing against all saved searches
   ├── Each saved search is stored as a Typesense query document
   ├── Worker runs the listing's attributes against all saved search queries
   └── Finds all saved searches this listing matches

3. Record matches
   └── Insert into notification_queue table: (user_id, listing_id, saved_search_id, matched_at)

4. Notification dispatch (configurable frequency per user)
   ├── Instant: push notification (Phase 2, mobile app)
   ├── Daily digest: batch email at 6 PM local time
   └── Weekly digest: batch email on Sunday

5. In-app saved search page
   └── Shows all matched listings since last visit, sorted chronologically (newest first)
```

**Price drop triggers:**
- Separate worker watches for listing price field changes
- On price drop > 5%: add to "Price Drop" notification queue
- These are highest-priority alerts (users who saved a listing expect price updates)

---

## Filter System Design

### Filter Categories (Full List)

#### Category 1: Intent & Type (Required, Primary)
| Filter | Values |
|---|---|
| Intent | Buy / Rent / Short-term Stay |
| Property Type | House, Flat/Apartment, Plot/Land, Commercial, Farm House, Room, Penthouse |
| Sub-type (contextual) | Studio, 1-bed, 2-bed... (auto-populated for Flat); Residential/Commercial (for Plot) |

#### Category 2: Location (Required, Primary)
| Filter | Values |
|---|---|
| City | Lahore, Karachi, Islamabad, Rawalpindi, Peshawar, Faisalabad... |
| Zone/Society | DHA, Bahria Town, Gulberg, F-sectors, etc. (populated from places index) |
| Sub-area/Phase | Phase 5, Phase 6, Block C, etc. |
| Radius | 1km, 2km, 5km from a point (map-drawn area) |

#### Category 3: Price
| Filter | Values |
|---|---|
| Price Range | Slider (PKR, USD for NRP mode) |
| Price Type | Total price / Per marla / Per sqft |
| Payment Mode | Full payment / Installment available (boolean) |
| Price Drop | "Price reduced in last 7/30 days" (boolean) |

#### Category 4: Size
| Filter | Values |
|---|---|
| Area (size) | Slider: 1 marla to 100 kanal (marla / kanal / sqft / sqm selector) |
| Bedrooms | 1, 2, 3, 4, 5+ |
| Bathrooms | 1, 2, 3, 4+ |
| Floors | Ground only, 1st floor, 2nd floor, any |

#### Category 5: Property Features
| Filter | Values |
|---|---|
| Furnishing | Unfurnished / Semi-furnished / Fully furnished |
| Condition | New / Used / Under construction |
| Facing | Corner plot / Park facing / Main boulevard |
| Floor level | Ground, 1st, 2nd, Penthouse (for apartments) |
| Basement | Yes/No |
| Servant quarters | Yes/No |
| Drawing/dining room | Yes/No |
| Garage | Yes/No (1-car, 2-car) |
| Generator backup | Yes/No |
| Solar panels | Yes/No |

#### Category 6: Community/Building
| Filter | Values |
|---|---|
| Gated community | Yes/No |
| Security 24/7 | Yes/No |
| Swimming pool | Yes/No |
| Gym | Yes/No |
| Community park | Yes/No |
| Commercial area nearby | Yes/No |

#### Category 7: Listing Quality & Trust
| Filter | Values |
|---|---|
| Verified listings only | Toggle (shows only verified agent listings) |
| With photos only | Toggle (excludes photo-less listings) |
| With video tour | Toggle |
| With floor plan | Toggle |

#### Category 8: Time-Based
| Filter | Values |
|---|---|
| Listed in last | 24h / 3 days / 7 days / 30 days |
| Refreshed in last | 7 days / 14 days / 30 days |
| Price updated | Any / Last 7 days / Last 30 days |

#### Category 9: Sort Options (Mutually Exclusive)
| Sort | Description |
|---|---|
| Relevance (default for search) | FeedScore blend |
| Newest first (default for browse) | publishedAt DESC |
| Price: Low to High | priceAmount ASC |
| Price: High to Low | priceAmount DESC |
| Most viewed | viewCount DESC |
| Trust Score | trustScore DESC |
| Freshness | refreshedAt DESC |

---

## Feed Refresh Strategy

### When the Feed Updates

| Event | Feed Impact |
|---|---|
| New listing published | Enters candidate pool immediately; cold start boost applied |
| Listing price updated | Freshness score boosted; triggers saved search match check |
| Listing refreshed by agent | Freshness score reset; re-evaluated in ranking |
| Listing archived/expired | Removed from candidate pool within 5 minutes |
| Agent tier upgraded | Trust score recalculated; listing re-ranked within 15 minutes |
| Report confirmed | Trust score recalculated; listing may drop in ranking |
| Boost credit applied | Boost score updated; listing re-ranked immediately |

### Cache & Serving Architecture

```
Request → Redis Cache (TTL 5 min per user/query combination)
         └── Cache miss → Typesense query → Re-rank → Redis write → Return

Anonymous feed → cached by city (TTL 15 min)
Authenticated feed → cached by user_id (TTL 5 min)
Search results → cached by query_hash (TTL 10 min)
```

**BullMQ workers for async re-ranking triggers:**
- `listing.published` → trigger cold start worker
- `listing.updated` → trigger percolation worker + score recalculation
- `listing.expired` → trigger removal from Typesense index
- `report.confirmed` → trigger trust score recalculation worker
- `boost.applied` → trigger immediate score update

---

## Diversity & Anti-Gaming Rules

To prevent feed manipulation and maintain quality:

1. **Agent concentration cap:** No more than 3 listings from the same agent in any 10-listing window
2. **Boost ceiling:** Boosted listings cannot exceed Trust Score threshold of 40/100 (can't buy your way to top with a fake listing)
3. **Duplicate suppression:** Listings with suspected duplicate flag are demoted 40% in score
4. **Organic floor:** At least 60% of every feed page must be non-boosted listings
5. **Fresh injection:** 10% of every page is reserved for listings < 48h old (ensures new inventory is always visible)
6. **Price band respect:** Listings that don't match user's saved price range are never shown in personalized feed even if quality is high

---

## Personalization Data Model

```typescript
// User preference profile (stored in Redis + Postgres)
interface UserPreferenceProfile {
  userId: string;
  
  // Explicit (from onboarding / settings)
  preferredCities: string[];
  preferredPropertyTypes: PropertyType[];
  budgetMin: number | null;
  budgetMax: number | null;
  preferredIntent: 'buy' | 'rent' | 'both';
  
  // Implicit (from behavior — updated rolling window)
  recentSearchCities: string[];           // last 10 searches
  clickedPropertyTypes: PropertyType[];   // from last 30 clicks
  clickedPriceRange: { min: number; max: number }; // median of clicked listings
  savedListingIds: string[];
  viewedListingIds: string[];             // last 100
  
  // Behavioral affinity scores
  affinityByZone: Record<string, number>; // zone → affinity 0–1
  affinityByPropertyType: Record<string, number>;
  
  // Meta
  lastActiveAt: Date;
  isAnonymous: boolean;
  geoFallback: { lat: number; lng: number; source: 'gps' | 'ip' | 'city' };
}
```

---

## Feed Analytics & Monitoring

Track these metrics to continuously improve ranking:

| Metric | What It Measures |
|---|---|
| Click-through rate (CTR) per position | Are top-ranked items actually the most clicked? |
| Save rate by ranking position | Confirms quality of ranking |
| Inquiry conversion rate | Did the user contact the agent? |
| Time-to-contact (user sees listing → sends inquiry) | Faster = better relevance |
| Zero-result rate by query type | Parser/filter coverage gaps |
| Cold start CTR | Are new listings getting fair exposure? |
| Boost CTR vs organic CTR | Are boosted listings relevant or just visible? |
| Dedup flag rate | Duplicate detection effectiveness |

These metrics feed back into ranking weight tuning (A/B testing different W1–W5 distributions).

---

## Phase Assignment

| Component | Phase | Urgency |
|---|---|---|
| Basic search results feed (Typesense relevance) | Phase 1 — Week 1 | Already exists |
| Quality Score signal integration | Phase 1 | **Critical** |
| Freshness Score signal | Phase 1 | **Critical** |
| Trust Score signal | Phase 1 | **Critical** |
| FeedScore blended ranking | Phase 1 | High |
| Cold start new listing boost | Phase 1 | High |
| Saved search alert feed (percolation pattern) | Phase 1 | High |
| Filter system — Categories 1–5 | Phase 1 | **Critical** |
| Filter system — Categories 6–9 | Phase 1 | Medium |
| Diversity & anti-gaming rules | Phase 1 | High |
| Personalization (anonymous, location-based) | Phase 1 | High |
| Personalization (authenticated, behavioral) | Phase 2 | Medium |
| Boost Score + credit system | Phase 1 (revenue) | High |
| Feed cache architecture (Redis TTL) | Phase 1 | High |
| Feed analytics dashboard | Phase 1 | Medium |
| BullMQ re-ranking triggers | Phase 1 | High |
| Price drop alert feed | Phase 2 | Medium |
| AI-powered recommendation engine | Phase 2 | Medium |
