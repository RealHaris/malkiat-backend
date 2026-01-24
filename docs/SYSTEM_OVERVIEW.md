# System Overview

## Table of Contents

- [Introduction](#introduction)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Module Structure](#module-structure)
- [Project Directory](#project-directory)
- [Database Schema](#database-schema)
- [Search Architecture](#search-architecture)
- [Authentication](#authentication)
- [Environment Configuration](#environment-configuration)
- [Running the Application](#running-the-application)

---

## Introduction

Malkiat Backend is a real estate listing platform built with **NestJS** using **Domain-Driven Design (DDD)** and **CQRS (Command Query Responsibility Segregation)** patterns. The system separates write and read models for scalability and performance.

### Key Features

- **Write Model**: PostgreSQL + Drizzle ORM for ACID-compliant data persistence
- **Read Model**: Typesense with vector embeddings for fast, intelligent search
- **Event-Driven**: BullMQ queue for asynchronous event processing
- **Authentication**: Better Auth with email/password and OAuth (Google, Apple)
- **Role-Based Access Control**: Admin, Agent, and User roles

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Applications                    │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Server (NestJS)                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  Identity       │  │  Listing        │  │  Listing        │ │
│  │  Access Module  │  │  Management     │  │  Discovery      │ │
│  │  (Read/Write)   │  │  (Write)        │  │  (Read)         │ │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘ │
│           │                    │                     │          │
│           ▼                    ▼                     ▼          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  Better Auth    │  │  CQRS Commands  │  │  CQRS Queries   │ │
│  │  Handlers       │  │  & Handlers     │  │  & Handlers     │ │
│  └─────────────────┘  └────────┬────────┘  └─────────────────┘ │
│                                  │                               │
└──────────────────────────────────┼───────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Infrastructure Layer                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  PostgreSQL │  │  Redis      │  │  BullMQ     │              │
│  │  (Write)    │  │  (Cache)    │  │  (Queue)    │              │
│  └─────────────┘  └─────────────┘  └──────┬──────┘              │
└────────────────────────────────────────────┼────────────────────┘
                                             │
┌────────────────────────────────────────────┼────────────────────┐
│                 Worker Process             ▼                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Listing Events Worker                                  │   │
│  │  ┌─────────────────────────────────────────────────┐  │   │
│  │  │  Process: ListingCreated, ListingUpdated,       │  │   │
│  │  │           ListingDeleted                         │  │   │
│  │  │  Action: Sync to Typesense Index                 │  │   │
│  │  └─────────────────────────────────────────────────┘  │   │
│  └────────────────────┬────────────────────────────────┘   │
│                       │                                        │
│                       ▼                                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Typesense (Read)                                      │  │
│  │  - Full-text search with vector embeddings             │  │
│  │  - Fast faceted search                                 │  │
│  │  - Only indexes PUBLISHED listings                     │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### Design Patterns

#### CQRS (Command Query Responsibility Segregation)

- **Commands**: Modify state (Create, Update, Delete listings)
  - Flow: Controller → Command → Command Handler → Repository → PostgreSQL
  - Emits domain events after successful state change

- **Queries**: Read data without modification (Search, Discover)
  - Flow: Controller → Query → Query Handler → Typesense
  - Direct read from optimized search index

#### Domain-Driven Design (DDD)

- **Aggregates**: `Listing` - maintains invariants and emits domain events
- **Domain Events**: `ListingCreated`, `ListingUpdated`, `ListingDeleted`
- **Ports & Adapters**: Clean separation between domain and infrastructure

---

## Tech Stack

### Core Framework

| Technology       | Version | Purpose                                              |
| ---------------- | ------- | ---------------------------------------------------- |
| **NestJS**       | ^11.0.1 | Node.js framework for building scalable applications |
| **TypeScript**   | ^5.7.3  | Type-safe JavaScript superset                        |
| **@nestjs/cqrs** | ^11.0.0 | CQRS implementation                                  |

### Data Layer

| Technology      | Version | Purpose                                          |
| --------------- | ------- | ------------------------------------------------ |
| **PostgreSQL**  | -       | Primary database (Write Model)                   |
| **Drizzle ORM** | ^0.44.0 | Type-safe SQL query builder                      |
| **Drizzle Zod** | ^0.8.3  | Schema validation                                |
| **Typesense**   | ^2.1.0  | Open-source search engine with vector embeddings |

### Queue & Cache

| Technology      | Version | Purpose                                     |
| --------------- | ------- | ------------------------------------------- |
| **BullMQ**      | ^5.41.0 | Redis-backed job queue for event processing |
| **ioredis**     | ^5.9.2  | Redis client for caching and queue backend  |
| **Redis Stack** | -       | Cache and BullMQ backend                    |

### Authentication

| Technology                       | Version | Purpose                                           |
| -------------------------------- | ------- | ------------------------------------------------- |
| **better-auth**                  | ^1.4.17 | Authentication with OAuth and email/password      |
| **@thallesp/nestjs-better-auth** | ^2.2.2  | NestJS integration for better-auth                |
| **Resend**                       | ^6.8.0  | Email sending for verification and password reset |

### Validation & Utilities

| Technology            | Version | Purpose             |
| --------------------- | ------- | ------------------- |
| **class-validator**   | ^0.14.3 | DTO validation      |
| **class-transformer** | ^0.5.1  | Data transformation |
| **Zod**               | ^3.24.1 | Schema validation   |
| **Winston**           | ^3.19.0 | Logging             |

---

## Module Structure

### 1. Identity Access Module

**Location**: `src/modules/identity-access/`

**Purpose**: Handles user authentication and authorization

**Components**:

- **Auth Module**: Integration with Better Auth
  - Email/password authentication
  - OAuth providers (Google, Apple)
  - Email verification
  - Password reset

- **Users Controller**: User profile endpoints
  - `GET /users/me` - Get current user
  - `GET /users/public` - Public test route
  - `GET /users/optional` - Optional auth route

**Database Tables**:

- `user` - User accounts
- `session` - User sessions
- `account` - OAuth accounts
- `verification` - Email verification tokens

---

### 2. Listing Management Module (Write Model)

**Location**: `src/modules/listing-management/`

**Purpose**: Handles listing CRUD operations and domain events

**Architecture**:

```
Controller → Command → Handler → Aggregate → Repository → PostgreSQL
                                          │
                                          └→ Domain Events → BullMQ
```

**Components**:

#### Domain Layer (`domain/`)

- `listing.aggregate.ts` - Listing aggregate with invariants
  - `create()` - Create new listing (emits `ListingCreated`)
  - `update()` - Update listing (emits `ListingUpdated`)
  - `markDeleted()` - Mark for deletion (emits `ListingDeleted`)
- `listing-status.ts` - Status enum: DRAFT, PUBLISHED, ARCHIVED

#### Application Layer (`application/`)

- **Commands** (`commands/`):
  - `CreateListingCommand`
  - `UpdateListingCommand`
  - `DeleteListingCommand`

- **Handlers** (`handlers/`):
  - `CreateListingHandler` - Creates listing and publishes events
  - `UpdateListingHandler` - Updates listing and publishes events
  - `DeleteListingHandler` - Deletes listing and publishes events

- **Ports** (`ports/`):
  - `ListingRepository` - Repository interface
  - `ListingEventsPublisher` - Event publisher interface

#### Presentation Layer (`presentation/`)

- `listings.controller.ts` - REST API controller
  - `POST /listings` - Create listing
  - `PATCH /listings` - Update listing
  - `DELETE /listings` - Delete listing

- **DTOs** (`dto/`):
  - `CreateListingDto`
  - `UpdateListingDto`
  - `DeleteListingDto`

#### Infrastructure Layer (`infrastructure/`)

- `drizzle-listing.repository.ts` - PostgreSQL repository implementation
- `bullmq-listing-events.publisher.ts` - BullMQ event publisher

**Database Table**:

- `listings` - Primary listing data (write model)

---

### 3. Listing Discovery Module (Read Model)

**Location**: `src/modules/listing-discovery/`

**Purpose**: Handles listing search and discovery operations

**Architecture**:

```
Controller → Query → Handler → Typesense Search → Results
```

**Components**:

#### Application Layer (`application/`)

- **Queries** (`queries/`):
  - `DiscoverListingsQuery` - Browse listings with filters
  - `SearchListingsQuery` - Full-text search with vector embeddings

- **Handlers** (`handlers/`):
  - `DiscoverListingsHandler` - Discovery query handler
  - `SearchListingsHandler` - Search query handler

- **Types** (`types/`):
  - `ListingCard` - Lightweight listing representation
  - `PaginatedResult` - Pagination wrapper

#### Presentation Layer (`presentation/`)

- `public-listings.controller.ts` - Public API controller
  - `GET /public/listings/discovery` - Discover listings
  - `GET /public/listings/search` - Search listings

#### Infrastructure Layer (`infrastructure/`)

- `listings.search.ts` - Typesense search implementation
  - Faceted search by property type, currency, price range
  - Sort by newest, price, or relevance
  - Vector embeddings for semantic search

**Search Index**:

- Typesense collection: `listings`
- Only indexes `PUBLISHED` listings
- Vector embeddings from title and description

---

## Project Directory

```
shiny-lagoon/
├── src/
│   ├── app/
│   │   ├── app.api.module.ts          # API module (main entry)
│   │   ├── app.worker.module.ts       # Worker module
│   │   └── di.tokens.ts               # Dependency injection tokens
│   │
│   ├── infrastructure/                 # Infrastructure providers
│   │   ├── auth/
│   │   │   ├── better-auth.instance.ts # Better Auth configuration
│   │   │   └── redis-secondary-storage.ts
│   │   ├── db/
│   │   │   └── drizzle/
│   │   │       ├── client.ts
│   │   │       ├── provider.ts
│   │   │       └── schema/
│   │   │           ├── better-auth.ts  # Auth tables
│   │   │           ├── listings.ts    # Listings table
│   │   │           ├── outbox-events.ts # Event outbox (future)
│   │   │           └── index.ts
│   │   ├── queue/
│   │   │   ├── bullmq.provider.ts
│   │   │   └── listing-events-queue.provider.ts
│   │   ├── redis/
│   │   │   ├── client.ts
│   │   │   └── provider.ts
│   │   ├── typesense/
│   │   │   └── provider.ts
│   │   └── infrastructure.module.ts
│   │
│   ├── modules/
│   │   ├── identity-access/
│   │   │   ├── auth/
│   │   │   │   └── auth.module.ts
│   │   │   ├── users/
│   │   │   │   └── users.controller.ts
│   │   │   └── identity-access.module.ts
│   │   │
│   │   ├── listing-management/
│   │   │   ├── application/
│   │   │   │   ├── commands/
│   │   │   │   ├── handlers/
│   │   │   │   └── ports/
│   │   │   ├── domain/
│   │   │   │   ├── listing.aggregate.ts
│   │   │   │   └── listing-status.ts
│   │   │   ├── infrastructure/
│   │   │   │   ├── drizzle/
│   │   │   │   └── queue/
│   │   │   ├── presentation/
│   │   │   │   ├── dto/
│   │   │   │   └── listings.controller.ts
│   │   │   └── listing-management.module.ts
│   │   │
│   │   └── listing-discovery/
│   │       ├── application/
│   │       │   ├── handlers/
│   │       │   ├── queries/
│   │       │   └── types/
│   │       ├── infrastructure/
│   │       │   └── typesense/
│   │       ├── presentation/
│   │       │   └── public-listings.controller.ts
│   │       └── listing-discovery.module.ts
│   │
│   ├── shared/
│   │   ├── auth/
│   │   │   └── roles.ts
│   │   ├── config/
│   │   │   ├── config.constants.ts
│   │   │   ├── config.module.ts
│   │   │   └── env.ts
│   │   └── logger/
│   │       ├── logger.factory.ts
│   │       └── logger.module.ts
│   │
│   ├── worker/
│   │   ├── listing-events.worker.provider.ts
│   │   ├── typesense/
│   │   │   └── listings.indexer.ts
│   │   └── worker.module.ts
│   │
│   ├── main.ts                           # API bootstrap
│   ├── worker-main.ts                    # Worker bootstrap
│   └── auth.ts                           # Better Auth instance
│
├── scripts/
│   └── typesense/
│       ├── create-listings-collection.ts # Create Typesense schema
│       └── backfill-listings.ts          # Backfill existing data
│
├── drizzle.config.ts                     # Drizzle configuration
├── nest-cli.json                         # Nest CLI config
├── tsconfig.json                         # TypeScript config
├── package.json
└── .env.example
```

---

## Database Schema

### Listings Table (Write Model)

```sql
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price_amount NUMERIC(12, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'PKR',
  property_type VARCHAR(50),
  status VARCHAR(20) DEFAULT 'DRAFT',  -- DRAFT, PUBLISHED, ARCHIVED
  address_json JSONB,
  attributes JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Typesense Collection Schema (Read Model)

```javascript
{
  "name": "listings",
  "fields": [
    { "name": "id", "type": "string" },
    { "name": "title", "type": "string" },
    { "name": "description", "type": "string", "optional": true },
    { "name": "status", "type": "string", "facet": true },
    { "name": "propertyType", "type": "string", "facet": true },
    { "name": "currency", "type": "string", "facet": true },
    { "name": "priceAmount", "type": "float" },
    { "name": "createdAt", "type": "int64" },
    {
      "name": "embedding",
      "type": "float[]",
      "embed": {
        "from": ["title", "description"],
        "model_config": {
          "model_name": "ts/all-MiniLM-L12-v2"
        }
      }
    }
  ],
  "default_sorting_field": "createdAt"
}
```

**Note**: Typesense only indexes listings with `status = 'PUBLISHED'`

---

## Search Architecture

### Typesense Integration

**Purpose**: Provide fast, intelligent search for listings

**Features**:

- Full-text search on title and description
- Vector embeddings for semantic search
- Faceted search (property type, currency, status)
- Price range filtering
- Multiple sort options (relevance, newest, price)

### Discovery Endpoint

**Route**: `GET /public/listings/discovery`

**Purpose**: Browse listings with optional filters

**Parameters**:

- `page`: Page number (default: 1)
- `perPage`: Items per page (default: 20)
- `sort`: `newest`, `price_asc`, `price_desc` (default: newest)
- `propertyType`: Filter by property type
- `currency`: Filter by currency

**Implementation**: `TypesenseListingsSearch.discover()`

### Search Endpoint

**Route**: `GET /public/listings/search`

**Purpose**: Full-text semantic search

**Parameters**:

- `q`: Search query (required)
- `page`: Page number (default: 1)
- `perPage`: Items per page (default: 20)
- `sort`: `relevance`, `newest`, `price_asc`, `price_desc` (default: relevance)
- `propertyType`: Filter by property type
- `currency`: Filter by currency
- `minPrice`: Minimum price filter
- `maxPrice`: Maximum price filter

**Implementation**: `TypesenseListingsSearch.search()`

**Features**:

- Hybrid search: keyword + vector embeddings
- Vector query: `embedding:([], k:200)` - top 200 nearest neighbors
- Filter: Only returns `status = 'PUBLISHED'` listings

---

## Authentication

### Better Auth Configuration

**Supported Methods**:

1. **Email/Password**
   - Sign up with email verification required
   - Sign in with credentials
   - Password reset via email

2. **OAuth**
   - Google OAuth
   - Apple OAuth

3. **Session Management**
   - Session-based authentication
   - Redis secondary storage for fast session lookup
   - Automatic session expiration

### Authentication Endpoints

| Endpoint                   | Method | Auth Required | Description                 |
| -------------------------- | ------ | ------------- | --------------------------- |
| `/sign-up/email`           | POST   | No            | Create new user account     |
| `/sign-in/email`           | POST   | No            | Sign in with email/password |
| `/sign-out`                | POST   | Yes           | Sign out current user       |
| `/get-session`             | GET    | Yes           | Get current session         |
| `/send-verification-email` | POST   | No            | Send verification email     |
| `/verify-email`            | GET    | No            | Verify email with token     |
| `/forgot-password`         | POST   | No            | Request password reset      |
| `/reset-password`          | POST   | No            | Reset password with token   |
| `/sign-in/social`          | GET    | No            | Initiate OAuth flow         |

### Role-Based Access Control

**Roles**:

- `admin` - Full access to all endpoints
- `agent` - Access to listing management endpoints
- `user` - Read-only access to public endpoints

**Protected Endpoints**:

- `POST /listings` - Requires `admin` or `agent`
- `PATCH /listings` - Requires `admin` or `agent`
- `DELETE /listings` - Requires `admin` or `agent`

---

## Environment Configuration

### Required Environment Variables

```bash
# Application
PORT=3000
NODE_ENV=development

# Logging
LOG_LEVEL=info
LOG_DIR=logs
LOG_MAX_FILES=3d
LOG_MAX_SIZE=20m

# Database (PostgreSQL)
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres

# Authentication
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_BASE_URL=http://localhost:3000
APP_PUBLIC_URL=http://localhost:3000

# Email (Resend)
RESEND_API_KEY=re-api-key
RESEND_FROM_EMAIL=hello@realharis.works

# OAuth (Optional)
GOOGLE_CLIENT_ID=google-client-id
GOOGLE_CLIENT_SECRET=google-client-secret
APPLE_CLIENT_ID=apple-client-id
APPLE_CLIENT_SECRET=apple-client-secret

# Redis
REDIS_URL=redis://default:[PASSWORD]@[HOST]:[PORT]

# BullMQ Queue
BULLMQ_REDIS_URL=redis://default:[PASSWORD]@[HOST]:[PORT]

# Typesense
TYPESENSE_HOST=localhost
TYPESENSE_PORT=8108
TYPESENSE_PROTOCOL=http
TYPESENSE_ADMIN_API_KEY=typesense-api-key
TYPESENSE_COLLECTION_LISTINGS=listings

# Event Queue
LISTING_EVENTS_QUEUE_NAME=listing-events
```

---

## Running the Application

### Development

```bash
# Install dependencies
npm install

# Run API server with auto-reload
npm run start:api:dev

# Run worker with auto-reload
npm run start:worker:dev

# Run type checking
npm run typecheck

# Run linting
npm run lint
```

### Production

```bash
# Build the project
npm run build

# Start API server
npm run start:prod

# Start worker
npm run start:worker
```

### Database Migrations

```bash
# Generate migration
npm run db:generate

# Run migration
npm run db:migrate

# Push changes (development only)
npm run db:push

# Open Drizzle Studio
npm run db:studio
```

### Typesense Setup

```bash
# Create listings collection
npm run typesense:collection:listings

# Backfill existing listings
npm run typesense:backfill:listings
```

---

## Summary

Malkiat Backend implements a scalable, event-driven architecture with clear separation of concerns:

- **Write Path**: PostgreSQL for reliable, ACID-compliant data storage
- **Read Path**: Typesense for fast, intelligent search with vector embeddings
- **Event Processing**: BullMQ for asynchronous, reliable event handling
- **Authentication**: Better Auth for flexible authentication methods
- **Architecture**: CQRS + DDD for maintainable, testable code

For detailed event flow and worker implementation, see [EVENTS_EXPLAINED.md](./EVENTS_EXPLAINED.md).
