# Plan 10 - Agent Availability & In-Portal Contact System

> How Malkiat solves agent unavailability — the #2 most reported pain point across every real estate market — through in-portal messaging, availability status, response tracking, and AI-assisted communication.

---

## The Pain Point: Urgency Level = CRITICAL

**Agent unavailability is the #2 user complaint globally** (after fake listings), and in Pakistan it's arguably worse:

- Users tap "Contact Agent" → get a WhatsApp number → message is never seen or ignored for days
- 78% of buyers choose the **first agent who responds** — speed is everything
- In UAE research: buyers expect responses within **5 minutes**; 92% of buyers start online
- Pakistan-specific: agents juggle multiple portals, WhatsApp groups, and in-person meetings with no unified inbox
- Current state on Zameen.com: zero in-portal messaging. 100% of contact flows exit the platform

**The result:** The portal loses visibility into what happens after inquiry. No data. No quality control. No trust signal.

**The Malkiat opportunity:** Keep communication in-platform. Own the inquiry-to-viewing pipeline. Make agent responsiveness measurable, visible, and part of the ranking signal.

---

## Why Not Just WhatsApp?

WhatsApp CTA is fine as a supplementary channel, but as the **only** channel it creates serious problems:

| Problem | Impact |
|---|---|
| Malkiat loses contact analytics | Can't measure inquiry → response → viewing conversion |
| Agent can't be held accountable | If they ignore, Malkiat can't see it |
| Buyer has no record | No organized inquiry history |
| Spam | User's number is shared; agent may add them to broadcast groups |
| No availability signal | User doesn't know if agent is available before contacting |
| No automation possible | Can't qualify or route leads without portal-layer involvement |

In-portal messaging solves all of these, with WhatsApp as an additional notification channel (not the primary one).

---

## The Agent Availability System — Full Design

### 1. Agent Online Status

Every agent has a real-time online status displayed on their profile and listing detail pages.

#### Status Types

| Status | Display | Meaning |
|---|---|---|
| 🟢 **Online Now** | Green dot | Active on platform in last 15 minutes |
| 🟡 **Active Today** | Yellow dot | Last seen within 24 hours |
| 🔵 **Usually Responds in X hours** | Blue clock | Based on historical response time |
| ⚫ **Away** | Grey dot | No activity in 24h+ |

**Status is computed automatically** — no agent needs to manually "set" their status. It's derived from:
- Last login/activity timestamp (API calls, page loads on agent dashboard)
- Last response to an inquiry (strongest signal)

#### Why This Matters for Users

On the listing detail page, users see:

```
┌────────────────────────────────────────┐
│  Ahmed Khan                            │
│  🟢 Online Now                         │
│  Usually responds in < 30 minutes      │
│  ★ Elite Agent • 4.8 response score    │
│                                        │
│  [💬 Message on Malkiat]  [WhatsApp]   │
└────────────────────────────────────────┘
```

A user sees the agent is online right now. They're far more likely to send a message than if the agent appears offline or has no status at all.

---

### 2. In-Portal Messaging (Chat)

#### Architecture

Inspired by Bayut Chat (the most advanced implementation in the regional market), but extended for Pakistan-specific needs.

**For users:**
- Start a conversation directly from the listing detail page (no leaving the portal)
- Registered Malkiat users only (requires account — reduces spam)
- Guest inquiries: form-based only; chat requires login
- Conversation is attached to the specific listing

**For agents:**
- All incoming messages appear in a unified **Malkiat Inbox** (web + mobile app)
- Each conversation thread is linked to: listing → user → inquiry history
- Messages from the same user about different listings appear as one contact thread
- Mobile push notification for every new message (Phase 2 — when app launches)
- Email notification fallback if agent doesn't open app within 5 minutes

#### Message Features

| Feature | Description |
|---|---|
| Text messages | Standard real-time messaging |
| Photo sharing | Both parties can share photos (user sends exterior photo; agent sends additional property photos) |
| Quick replies | Agent pre-sets templated replies (e.g., "Still available! When would you like to visit?") |
| Listing card embed | The listing being discussed is pinned at top of conversation |
| Schedule viewing | Inline viewing request with date/time selector (no external calendar needed) |
| "No longer available" quick close | Agent one-tap to mark listing unavailable + auto-reply to all active inquiries |

#### Read Receipts & Delivery Status

- ✓ Sent → ✓✓ Delivered → ✓✓ (blue) Read — same as WhatsApp pattern
- Users can see if agent has read their message
- This creates accountability: agents can't claim "I never got your message"

---

### 3. Response Time Tracking & Scoring

This is the differentiator. Making agent responsiveness **visible and ranked** creates market pressure to be responsive.

#### How Response Time Is Measured

```
ResponseTime = (timestamp of agent's first reply) - (timestamp of user's inquiry)

Measured per inquiry, rolling 90-day average.
```

Only first responses count (not follow-ups). Only business hours apply (8 AM – 10 PM PKT, adjustable per agent).

#### Agent Response Score (0–100)

| Response Time | Score | Label |
|---|---|---|
| < 15 minutes | 95–100 | ⚡ Lightning Fast |
| 15–60 minutes | 80–94 | 🚀 Very Fast |
| 1–4 hours | 60–79 | ✓ Responsive |
| 4–12 hours | 40–59 | 🐢 Slow |
| 12–24 hours | 20–39 | ⚠ Very Slow |
| > 24 hours | 0–19 | ❌ Unresponsive |
| Never responded | 0 | ❌❌ Non-responsive |

#### Response Score in Ranking

Response Score feeds into the **Trust Score** (Plan 8/9) and affects:
- Listing ranking in search results (responsive agents rank higher)
- Agent profile badge (shown publicly)
- Agent CRM dashboard (self-monitoring)

**Hard consequence:** Agents with Response Score < 30 for 14 consecutive days receive a warning. Below 20 for 30 days: listings are de-prioritized in discovery feed and agent is notified that their account is at risk.

---

### 4. "Available for Viewing" Scheduling

A separate feature from messaging — the lightweight scheduling layer.

#### How It Works

On every listing detail page, below the agent contact section:

```
┌──────────────────────────────────────────────┐
│  📅 Schedule a Viewing                        │
│                                              │
│  Available slots this week:                  │
│  ○ Mon Apr 14, 10:00 AM                      │
│  ○ Mon Apr 14, 3:00 PM                       │
│  ○ Tue Apr 15, 11:00 AM                      │
│  ○ Thu Apr 17, 5:00 PM                       │
│                                              │
│  [Select a slot] → [Confirm Viewing]         │
└──────────────────────────────────────────────┘
```

- **Agent pre-sets availability slots** in their dashboard (calendar view, like Calendly)
- User picks a slot → viewing request sent to agent → agent confirms or declines within 1 hour
- Confirmed viewings: both parties get email + in-app reminder 1 hour before
- Declined viewings: user is auto-notified with "Agent suggested these alternative times: [...]"

**This removes the back-and-forth WhatsApp dance** ("When are you free?" "Maybe Tuesday?" "Which time?" ...). The slot system resolves it in 2 clicks.

---

### 5. Inquiry Management for Agents (CRM Layer)

Full detail in Plan 5 (Agent CRM module), but the key availability-related features:

#### Inquiry Status Pipeline

```
New Inquiry → Contacted → Viewing Scheduled → Showing Done → Deal/No Deal
```

Agent manually moves each inquiry through the pipeline. This:
- Gives Malkiat visibility into conversion at each stage
- Feeds aggregate metrics into platform health monitoring
- Gives the agent a structured workflow instead of WhatsApp chaos

#### "No Longer Available" Quick Action

When an agent receives an inquiry on a listing that's already been rented/sold:
1. One-tap "Mark as Unavailable" in the inquiry response interface
2. System auto-replies to the user: "Thanks for your interest. This property is no longer available. Here are 5 similar listings:"
3. Listing status changes to ARCHIVED and is removed from search
4. Malkiat records a clean unavailability event (no report needed)

This prevents the bait-and-switch pattern where the agent manually redirects without ever marking the listing unavailable.

---

### 6. AI-Assisted Agent Responses (Phase 2)

Once messaging volume grows, AI assistance reduces agent workload and improves response speed.

#### AI Quick Reply Suggestions

When an inquiry comes in, the agent sees:

```
User: "Is this 5 marla house still available? What's the final price?"

AI Suggestions:
  [A] "Yes, still available! Price is negotiable. When would you like to visit?"
  [B] "Yes! Final price is PKR 1.8Cr. We have slots available this week."
  [C] "This property is no longer available, but I have a similar one. Interested?"
```

Agent taps a suggestion to send (and can edit before sending). Reduces response friction from 3 minutes to 15 seconds.

#### AI Lead Qualifier

Before routing the inquiry to the agent, the system can:
- Analyze the user's inquiry history and browsing behavior
- Estimate their budget seriousness (viewed only cheap listings? → soft lead. Viewed multiple high-value listings + saved several → hot lead)
- Show the agent: "🔥 Hot lead: This user has viewed 12 DHA Phase 5 listings in the last 7 days"

#### Auto-Responder (Agent Away Mode)

When agent is away (status = Away or outside business hours):
- Auto-reply triggers: "Hi! I'm not available right now, but I'll respond within 3 hours. In the meantime, here are the key details about this property..."
- Auto-responder message is pre-configured by the agent in settings
- Timer: if agent doesn't respond within their promised time, Malkiat escalates (nudge notification to agent)

---

### 7. Contact Channels — Priority Stack

The contact experience on every listing detail page follows this priority stack:

```
Priority 1: In-Portal Chat (if agent has it enabled)
   ↓ Agent not available / feature not enabled
Priority 2: Schedule a Viewing (availability slots)
   ↓ No slots set
Priority 3: Inquiry Form (async, in-portal)
   ↓ All options above
Priority 4: WhatsApp (external, always available as fallback)
```

**Why this order:**
- In-portal chat keeps the conversation on Malkiat → accountability, data, analytics
- Scheduling removes friction for serious buyers → higher conversion
- Inquiry form is async but still on-platform
- WhatsApp is last because it exits the platform and creates no data for Malkiat

**WhatsApp is always shown** — we don't hide it. But the UX design makes in-portal options the natural first choice.

---

### 8. Buyer Inquiry History (User Side)

Users have a dedicated "My Inquiries" section showing:

| Column | Content |
|---|---|
| Property | Listing thumbnail + title |
| Agent | Agent name + response status |
| Last message | Preview of last message |
| Status | Awaiting reply / Replied / Viewing scheduled / Closed |
| Actions | Continue chat, View listing, Remove |

**"Awaiting reply" + timer:** If agent hasn't responded in 24h, user sees "⚠ Agent hasn't replied in 24h. Try WhatsApp or contact another agent." Plus a recommendation of 3 similar listings with faster-responding agents.

This is user protection — they're never left in limbo.

---

## Urgency Classification Within Phases

### Phase 1 (MVP — Critical to launch with this)

| Feature | Urgency | Reason |
|---|---|---|
| In-portal inquiry form (async, structured) | 🔴 Critical | Without this, Malkiat has zero post-click data |
| Agent response time tracking | 🔴 Critical | Needed for Trust Score signal in ranking |
| Response time shown on agent profile + listing | 🔴 Critical | Directly addresses #2 pain point |
| "No longer available" quick action | 🔴 Critical | Closes the bait-and-switch loop |
| Buyer inquiry history ("My Inquiries" page) | 🟠 High | User protection from being ignored |
| WhatsApp CTA (always present as fallback) | 🟠 High | Non-negotiable for Pakistan market today |
| Agent online status (Active Today / Away) | 🟡 Medium | Strong UX signal, but can follow inquiry form |

### Phase 2 (After core trust layer is solid)

| Feature | Urgency | Reason |
|---|---|---|
| Real-time in-portal chat (Bayut Chat model) | 🟠 High | The premium contact channel — needs mobile app first |
| Viewing scheduler (slot picker) | 🟠 High | Removes friction for serious buyers; drives conversion |
| AI quick reply suggestions | 🟡 Medium | Agent efficiency feature; valuable at scale |
| AI lead qualification display | 🟡 Medium | Needs interaction data to be accurate |
| Auto-responder (away mode) | 🟡 Medium | Good to have; completes the response story |
| Mobile push notifications for messages | 🔴 Critical for Phase 2 | Real-time chat is useless without push notifications |

---

## Technical Stack for Messaging

| Component | Technology | Notes |
|---|---|---|
| Message storage | PostgreSQL (conversations, messages table) | Persistent, auditable |
| Real-time delivery | WebSockets (Socket.io or native WebSocket) | For in-portal chat (Phase 2) |
| Async inquiries (Phase 1) | Standard REST + BullMQ notification worker | Simpler, no WS needed for Phase 1 |
| Push notifications | FCM (Android) + APNs (iOS) via Expo/OneSignal | Phase 2 with mobile app |
| Email notification fallback | Resend (already integrated) | Agent receives email if no app active |
| WhatsApp notification | WhatsApp Business API (Meta) | Phase 2 — agent WhatsApp integration |
| Response time computation | BullMQ scheduled job — runs hourly, updates agent.responseScore | Simple, accurate |

---

## Success Metrics

| Metric | Target |
|---|---|
| Inquiry response rate | > 70% of inquiries get a response within 24h |
| Median first response time | < 2 hours across all agents |
| "No longer available" quick-close usage | > 50% of listings marked unavailable via this tool (vs just expiring) |
| In-portal contact vs WhatsApp ratio | > 40% via in-portal by Month 6 (Phase 1) |
| User "still waiting" complaint rate | < 5% of inquiries marked "no reply in 24h" |
| Viewing schedule completion rate | > 60% of scheduled viewings result in a physical viewing |
