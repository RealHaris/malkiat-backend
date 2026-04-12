# Plan 9 - Listing Quality Ranking System

> How Malkiat scores, ranks, and surfaces listing quality — the complete system design for the Quality Score that directly determines search ranking and feed position.

---

## Why Listing Quality Is a First-Class Product Primitive

**The single biggest pain point across every real estate portal in every market researched:**
Users waste time on listings that are fake, stale, or so poorly described they can't make any decision.

Quality Score solves this at the root: instead of relying on moderation to clean up bad listings after the fact, the ranking system *automatically surfaces good listings and buries bad ones in real time*.

**Evidence from the market:**
- Professional photography generates **118% more online views** than average images
- Bayut's TruCheck™ badge (verification of availability) generates **5x more leads** and **20x more impressions**
- Zillow's algorithm monitors clicks, saves, shares, and time spent viewing photos — low engagement causes **algorithmic deprioritization** (the listing simply disappears)
- Real estate portals that implemented quality-score-based ranking reported **35% improvement in user satisfaction**

---

## The Malkiat Quality Score — Overview

Every published listing receives a **Quality Score from 0 to 100**. This score is:
- Computed automatically at publish time
- Recomputed whenever the listing is updated
- Displayed on every listing card and detail page (color-coded)
- Used as a direct signal in the FeedScore ranking formula (Plan 8)
- Shown to the agent in their dashboard with a per-factor breakdown

### Score Tiers

| Score | Tier | Badge Color | Ranking Effect |
|---|---|---|---|
| 85–100 | Platinum | Deep blue ◆ | Maximum organic ranking |
| 70–84 | Gold | Gold ★ | Strong organic ranking |
| 50–69 | Standard | Green ✓ | Normal ranking |
| 30–49 | Below Average | Orange △ | Demoted in feed |
| 0–29 | Poor | Red ✕ | Suppressed to bottom; agent warned |

---

## Quality Score — Factor Breakdown

### Factor 1: Photo Quality (35 points total)

Photos are the single highest-impact quality signal in every real estate platform researched. A listing without good photos simply does not get clicked.

#### 1a. Photo Count (15 points)
| Photos | Points |
|---|---|
| 0 photos | 0 (listing blocked from publish — hard gate) |
| 1–2 photos | 3 |
| 3–4 photos | 6 |
| 5–7 photos | 10 |
| 8–12 photos | 13 |
| 13+ photos | 15 |

#### 1b. AI Photo Quality Score (20 points)

Computer vision scoring on uploaded images. Each image is evaluated on:

| Sub-factor | What it checks |
|---|---|
| **Brightness / Exposure** | Not too dark, not blown out |
| **Sharpness / Blur** | Not blurry or shaky |
| **Composition** | Camera level, room properly framed |
| **Room Coverage** | Does the listing cover key rooms? |
| **Exterior Shot** | Is there at least 1 exterior photo? |
| **Clutter / Staging** | Heavily cluttered rooms score lower |

**Score calculation:**
- Each image receives an AI score 1–6 (Poor → Excellent)
- Per room category, the best image score is taken
- Final AI score = weighted average across: exterior (25%), living area (25%), bedrooms (20%), kitchen (15%), bathrooms (15%)
- Mapped to 0–20 points

**Implementation:** Use an image quality API (e.g., Repliers.com API, or open-source model like LAION's aesthetic predictor, or OpenAI Vision API scoring prompt). Phase 1 can use rule-based scoring (photo count + basic brightness check). Phase 2 introduces full AI scoring.

#### 1c. Cover Image Quality Bonus
- Is a cover/hero image explicitly set? +2 bonus (counts inside 1b max)

---

### Factor 2: Description Completeness (20 points)

#### 2a. Description Length (10 points)
| Characters | Points |
|---|---|
| 0 | 0 |
| 1–99 | 2 |
| 100–299 | 5 |
| 300–599 | 7 |
| 600–999 | 9 |
| 1000+ | 10 |

#### 2b. Description Quality Signals (10 points)
AI-analyzed description content:
| Signal | Points |
|---|---|
| Mentions specific features (e.g., "park facing", "corner plot", "newly renovated") | +2 |
| Mentions specific location details (e.g., "near Packages Mall", "5 min from Ring Road") | +2 |
| Includes contact/showing info OR has proper CTA | +2 |
| No obvious copy-paste patterns (duplicate detection in description) | +2 |
| Urdu or bilingual description included | +2 (bonus for local market) |

**Implementation:** Phase 1: description character count only (2a). Phase 2: add NLP-based content quality check (2b).

---

### Factor 3: Attribute Completeness (25 points)

These are the structured fields that power filters. Missing fields mean the listing won't appear in filtered searches — double punishment.

| Field Group | Fields | Points |
|---|---|---|
| **Core fields** | Intent (buy/rent), property type, price | Required — blocked from publish |
| **Size fields** | Area (size + unit), bedrooms, bathrooms | 10 points if all present |
| **Location precision** | City (5), zone/society (5), sub-area (3), GPS coordinates (7) | Up to 20 points |
| **Condition fields** | Furnishing, condition (new/used), facing (corner/park/road) | Up to 5 points |

#### GPS Coordinates — Why They're Worth 7 Points
Listings without GPS coordinates:
- Cannot appear on the map view
- Cannot be used in commute distance calculations
- Cannot receive Nearby Amenities overlays
- Cannot support "near X" searches

GPS coordinates are the highest-value single field. Agents should be strongly incentivized to provide them.

**GPS capture:** On the listing creation form, show a map pin the agent can drag to the property location. Auto-fill from address where possible using Geocoding API (Google or open-source Nominatim).

---

### Factor 4: Media Richness Bonus (10 points)

These are optional but high-value media types. None are required for publish, but each adds points.

| Media | Points |
|---|---|
| Floor plan image uploaded | +4 |
| Video tour link (YouTube, Google Drive, etc.) | +3 |
| 360° virtual tour link (Matterport, etc.) | +3 |

---

### Factor 5: Verification Bonus (10 points)

| Status | Points |
|---|---|
| Agent is Unverified tier | 0 |
| Agent is Basic Verified | +3 |
| Agent is Professional tier | +6 |
| Agent is Elite tier | +10 |
| Listing has been manually spot-checked by Malkiat team | +5 (bonus, can stack) |

---

### Quality Score Formula

```
QualityScore = (PhotoCount points)      [0-15]
             + (AI Photo Quality)        [0-20]
             + (Description Length)      [0-10]
             + (Description Quality AI)  [0-10]
             + (Attribute Completeness)  [0-25]
             + (Media Richness)          [0-10]
             + (Verification Bonus)      [0-10]

Total: 0–100
```

**Phase 1 implementation (rule-based, no AI):**
```
QualityScore = PhotoCount(15) + DescriptionLength(10) + AttributeCompleteness(25) + MediaRichness(10) + VerificationBonus(10)
= Up to 70 points
```
Phase 1 max is 70 — agent is always shown headroom to improve.

**Phase 2 addition (AI signals):**
```
+ AI Photo Quality (20) + Description Quality AI (10)
```
Phase 2 max reaches full 100.

---

## Quality Score in the Agent Dashboard

Every agent sees their listing's quality score broken down by factor:

```
┌─────────────────────────────────────────────────────────┐
│  DHA Phase 6 House — Quality Score: 62 / 100  [Standard]│
│                                                          │
│  Photos         ████████████░░░░░░░  13/15              │
│  Photo Quality  ████████░░░░░░░░░░░   8/20  ← Add more  │
│  Description    ██████████████░░░░░  10/10  ✓            │
│  Attributes     ████████████████░░░  20/25  ← Add GPS   │
│  Media Richness ░░░░░░░░░░░░░░░░░░░   0/10  ← Add video │
│  Verification   ████████░░░░░░░░░░░   6/10  Professional │
│                                                          │
│  Tips to improve:                                        │
│  1. Add GPS coordinates → +7 points (attribute score)   │
│  2. Add a video tour → +3 points                        │
│  3. Upload floor plan → +4 points                       │
│  4. Improve photo brightness in 3 images → +4 points    │
└─────────────────────────────────────────────────────────┘
```

### Improvement Tips Are Ranked by Impact

The system always shows the highest-ROI tip first. If adding GPS coordinates gives +7 points and uploading a floor plan gives +4, GPS is tip #1. This gamification pattern (from Duolingo, Bayut's Profolio™, and LinkedIn's profile strength) drives completion behavior reliably.

---

## Quality Gates — Hard Requirements at Publish

Before any listing can enter `PUBLISHED` status, these hard gates must pass:

| Gate | Rule |
|---|---|
| Minimum photos | At least 3 photos must be uploaded |
| Price required | priceAmount > 0 required |
| Location required | City + Zone must be selected |
| Property type | Must be selected |
| Intent | Buy or Rent must be declared |
| Title | Minimum 20 characters |
| Description | Minimum 100 characters |

Listings failing any gate are saved as `DRAFT` with a validation message explaining what's missing.

---

## Quality Score Impact on Ranking

In the FeedScore formula (from Plan 8):

```
FeedScore = (Relevance × 0.25) + (Quality × 0.25) + (Trust × 0.20) + (Freshness × 0.20) + (Boost × 0.10)
```

Quality Score contributes 25% of the total feed rank in discovery mode. For a listing competing against 1,000 others in DHA Lahore:

| Scenario | Quality Score | Relative Feed Position |
|---|---|---|
| Poor listing (no video, few photos, incomplete fields) | 25/100 | Page 8+ |
| Average listing (basic photos, description, location) | 55/100 | Page 3–5 |
| Good listing (many photos, floor plan, GPS) | 75/100 | Page 1–2 |
| Excellent listing (professional photos, video, full attributes, verified agent) | 92/100 | Top 3 results in area |

**Boost cannot override quality:** A listing with Quality < 30 receives a 50% penalty on any boost it purchases. This prevents low-quality paid listings from dominating the feed.

---

## Listing Photo Ordering Algorithm

The cover image matters enormously for CTR. Malkiat should auto-suggest the best cover image:

1. AI scores all uploaded images
2. Highest-scoring exterior image → recommended as cover (option 1)
3. Highest-scoring interior (living room/main room) → recommended as cover (option 2)
4. Agent can override with manual selection
5. If agent doesn't choose, system uses AI's recommendation automatically

**Photo ordering for gallery:**
1. Exterior front (cover)
2. Main living area
3. Kitchen
4. Master bedroom
5. Other bedrooms
6. Bathrooms
7. Additional exterior / garden / roof
8. Floor plan (if uploaded, pinned last in gallery but shown in separate tab)

---

## Quality Score Decay Over Time

A listing that was great when published but not updated starts to feel stale. Quality Score should decay when:

- Listing hasn't been refreshed in 15+ days: -5 points from Quality Score per week beyond 15 days
- No agent activity (no inquiry responses in 30 days): -3 points from Quality Score
- Freshness timer expired and listing is within its grace period: Quality Score shown in orange warning state

This decay motivates agents to stay active and refresh listings regularly.

---

## Phase Assignment

| Component | Phase | Urgency |
|---|---|---|
| Hard quality gates at publish (photo min, required fields) | Phase 1 | **Critical** |
| Rule-based Quality Score (photo count + attributes + media) | Phase 1 | **Critical** |
| Quality score displayed on listing cards | Phase 1 | **Critical** |
| Quality score breakdown in agent dashboard | Phase 1 | **Critical** |
| Ranked improvement tips in agent dashboard | Phase 1 | High |
| GPS coordinate capture on listing form (map pin) | Phase 1 | High |
| Photo ordering suggestion (manual selection) | Phase 1 | Medium |
| Quality Score used in FeedScore blending | Phase 1 | **Critical** |
| Quality Score decay over time | Phase 1 | High |
| AI photo quality scoring (computer vision) | Phase 2 | High |
| AI description quality NLP analysis | Phase 2 | Medium |
| Auto-recommended cover image (AI-driven) | Phase 2 | Medium |
| Boost penalty for low quality listings | Phase 1 | High |
