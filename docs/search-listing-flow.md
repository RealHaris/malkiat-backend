# Search, Discovery, and Listing Creation Flow

This document explains how search/discovery and listing creation currently work, and how the target flow should work.

## Scope

- Search bar interaction flow (UI to backend).
- Public listing APIs: discovery and search.
- Authenticated listing APIs: create, update, delete.
- Internal backend modules and sync vs async boundaries.

## Sync vs Async Legend

- `SYNC`: request/response path; caller waits for completion.
- `ASYNC`: queued/background path; caller does not wait for completion.

## Diagram 1: Current End-to-End Flow

```mermaid
flowchart LR
  U[User]
  FE[Frontend Search Bar and Listing Screens]
  API[Backend API Controllers]

  subgraph PublicAPI[Public Endpoints]
    PUB1[GET /public/listings]
    PUB2[GET /public/listings/discovery]
    PUB3[GET /public/listings/search]
  end

  subgraph PrivateAPI[Private Endpoints]
    PRI1[POST /listings]
    PRI2[PATCH /listings]
    PRI3[DELETE /listings]
    PRI4[GET /listings/me]
  end

  subgraph Core[Core Modules]
    DISC[ListingsDiscoveryModule]
    MGMT[ListingsManagementModule]
    REPO[DrizzleListingRepository]
    CMD[Create, Update, Delete Command Handlers]
    QRY[Discover, Search Query Handlers]
  end

  subgraph DataPlane[Data and Indexing]
    PG[(Postgres listings tables)]
    QUEUE[(BullMQ listing-events queue)]
    WORKER[listing-events worker]
    TS[(Typesense listings collection)]
  end

  U --> FE
  FE --> API
  API --> PublicAPI
  API --> PrivateAPI

  PUB1 -->|SYNC| DISC
  PUB2 -->|SYNC| DISC
  PUB3 -->|SYNC| DISC
  DISC -->|SYNC current implementation path| REPO
  REPO -->|SYNC| PG

  QRY -. exists but not used by current public controller .-> TS

  PRI1 -->|SYNC| MGMT
  PRI2 -->|SYNC| MGMT
  PRI3 -->|SYNC| MGMT
  PRI4 -->|SYNC| MGMT

  MGMT -->|SYNC write and auth checks| CMD
  CMD -->|SYNC| REPO
  REPO -->|SYNC| PG

  CMD -->|ASYNC publish domain events| QUEUE
  QUEUE -->|ASYNC job consumption| WORKER
  WORKER -->|SYNC upsert or delete index doc| TS
```

## Diagram 2: Target End-to-End Flow

```mermaid
flowchart LR
  U[User]
  FE[Frontend Search Bar and Listing Screens]
  API[Backend API Controllers]

  subgraph PublicAPI[Public Endpoints]
    PUB1[GET /public/listings and /discovery]
    PUB2[GET /public/listings/search]
  end

  subgraph PrivateAPI[Private Endpoints]
    PRI1[POST, PATCH, DELETE /listings]
    PRI2[GET /listings/me]
  end

  subgraph QuerySide[Read Side CQRS]
    QBUS[QueryBus]
    DH[DiscoverListingsHandler]
    SH[SearchListingsHandler]
    TSEARCH[TypesenseListingsSearch]
  end

  subgraph CommandSide[Write Side CQRS]
    CBUS[CommandBus]
    CH[Create, Update, Delete Handlers]
    REPO[DrizzleListingRepository]
    PUB[ListingEventsPublisher]
  end

  subgraph DataPlane[Data and Indexing]
    PG[(Postgres listings tables)]
    QUEUE[(BullMQ listing-events queue)]
    WORKER[listing-events worker]
    TS[(Typesense listings collection)]
  end

  U --> FE
  FE --> API

  API --> PublicAPI
  API --> PrivateAPI

  PUB1 -->|SYNC| QBUS
  PUB2 -->|SYNC| QBUS
  QBUS -->|SYNC| DH
  QBUS -->|SYNC| SH
  DH -->|SYNC| TSEARCH
  SH -->|SYNC| TSEARCH
  TSEARCH -->|SYNC| TS

  PRI1 -->|SYNC| CBUS
  CBUS -->|SYNC| CH
  CH -->|SYNC| REPO
  REPO -->|SYNC| PG
  CH -->|ASYNC publish events| PUB
  PUB -->|ASYNC enqueue| QUEUE
  QUEUE -->|ASYNC consume| WORKER
  WORKER -->|SYNC upsert or delete| TS

  PRI2 -->|SYNC| REPO
  REPO -->|SYNC| PG
```

## Diagram 3: Search Bar Runtime Flow (Current vs Target)

```mermaid
sequenceDiagram
  autonumber
  actor User
  participant FE as Frontend Search Bar
  participant C as PublicListingsController
  participant R as ListingRepository
  participant Q as QueryBus + Search Handler
  participant TS as Typesense
  participant PG as Postgres

  rect rgb(245,245,245)
    note over User,PG: Current
    User->>FE: Type query + filters + submit
    FE->>C: GET /public/listings/search?q=...&city=Karachi
    C->>R: searchPublic(input) [SYNC]
    R->>PG: SQL filter + paginate [SYNC]
    PG-->>R: rows + total
    R-->>C: listing aggregates
    C-->>FE: items, page, perPage, total
    FE-->>User: render results list
  end

  rect rgb(235,245,255)
    note over User,TS: Target
    User->>FE: Type query + filters + submit
    FE->>C: GET /public/listings/search?q=...&city=Karachi
    C->>Q: execute(SearchListingsQuery) [SYNC]
    Q->>TS: hybrid search (text + vector) [SYNC]
    TS-->>Q: hits + found
    Q-->>C: listing cards + pagination
    C-->>FE: items, page, perPage, total/found
    FE-->>User: render ranked results
  end
```

## Diagram 4: Listing Create Internal Modules (Sync and Async)

```mermaid
sequenceDiagram
  autonumber
  actor Agent as Authenticated User
  participant LC as ListingsController
  participant CB as CommandBus
  participant CH as CreateListingHandler
  participant AR as Agency and Area Checks
  participant Repo as DrizzleListingRepository
  participant PG as Postgres
  participant Pub as BullmqListingEventsPublisher
  participant Q as BullMQ Queue
  participant W as ListingEventsWorker
  participant IDX as ListingsIndexer
  participant TS as Typesense

  Agent->>LC: POST /listings (payload)
  LC->>CB: execute(CreateListingCommand) [SYNC]
  CB->>CH: route command [SYNC]
  CH->>AR: validate actor, agency, subtype, area [SYNC]
  CH->>Repo: create(listing aggregate) [SYNC]
  Repo->>PG: insert listing and amenities [SYNC]
  PG-->>Repo: persisted
  Repo-->>CH: ok
  CH->>Pub: publish(domain events) [SYNC call]
  Pub->>Q: addBulk jobs [ASYNC boundary]
  CH-->>LC: { id }
  LC-->>Agent: 201 created

  Q-->>W: consume ListingCreated job [ASYNC]
  W->>PG: fetch latest listing row [SYNC]
  W->>IDX: upsert(mapped document) [SYNC]
  IDX->>TS: documents.upsert [SYNC]
  TS-->>IDX: indexed
```

## API Responsibilities at a Glance

| API | Purpose | Current data source | Target data source | Sync/Async |
| --- | --- | --- | --- | --- |
| `GET /public/listings` | Public browse list | Postgres via `ListingRepository.listPublic` | Typesense via `DiscoverListingsHandler` | Sync |
| `GET /public/listings/discovery` | Discovery feed | Postgres via `ListingRepository.listPublic` | Typesense via `DiscoverListingsHandler` | Sync |
| `GET /public/listings/search` | Text/filter search | Postgres via `ListingRepository.searchPublic` | Typesense via `SearchListingsHandler` | Sync |
| `GET /listings/me` | Owner dashboard list | Postgres | Postgres | Sync |
| `POST /listings` | Create listing | Postgres write + queue publish | Postgres write + queue publish | Sync + Async |
| `PATCH /listings` | Update listing | Postgres write + queue publish | Postgres write + queue publish | Sync + Async |
| `DELETE /listings` | Delete listing | Postgres delete + queue publish | Postgres delete + queue publish | Sync + Async |

## What Happens at Each Point (Quick Narrative)

1. User submits search in the frontend search bar.
2. Frontend sends validated query params to public search API.
3. Backend validates DTO and executes discovery/search path.
4. Current path reads from Postgres repository; target path reads from Typesense query handlers.
5. Backend returns paginated items for rendering.
6. For create/update/delete, backend writes Postgres first and returns API response.
7. Indexing happens asynchronously through queue + worker, then Typesense becomes eventually consistent with source-of-truth data.

## Notes for Product and Engineering Alignment

- Search freshness is eventually consistent because index updates happen after write response.
- Postgres remains source of truth for listing ownership, authorization, and write operations.
- Typesense is optimized for fast public discovery/search and ranking quality.
- A short delay between create/update/delete and search visibility is expected by design.
