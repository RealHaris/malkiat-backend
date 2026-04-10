# Malkiat Backend

A real estate listing platform built with **NestJS** using **Domain-Driven Design (DDD)** and **CQRS (Command Query Responsibility Segregation)** patterns.

## Features

- **Write Model**: PostgreSQL + Drizzle ORM for ACID-compliant data persistence
- **Read Model**: Typesense with vector embeddings for fast, intelligent search
- **Event-Driven**: BullMQ queue for asynchronous event processing
- **Authentication**: Better Auth with email/password and OAuth (Google, Apple)
- **Role-Based Access Control**: Admin, Agent, and User roles

## Tech Stack

| Technology       | Version | Purpose                                              |
| ---------------- | ------- | ---------------------------------------------------- |
| **NestJS**       | ^11.0.1 | Node.js framework for building scalable applications |
| **TypeScript**   | ^5.7.3  | Type-safe JavaScript superset                        |
| **@nestjs/cqrs** | ^11.0.0 | CQRS implementation                                  |
| **PostgreSQL**   | -       | Primary database (Write Model)                       |
| **Drizzle ORM**  | ^0.44.0 | Type-safe SQL query builder                          |
| **Typesense**    | ^2.1.0  | Open-source search engine with vector embeddings     |
| **BullMQ**       | ^5.41.0 | Redis-backed job queue for event processing          |
| **Redis Stack**  | -       | Cache and BullMQ backend                             |
| **better-auth**  | ^1.4.17 | Authentication with OAuth and email/password         |

## Architecture

The application implements CQRS (Command Query Responsibility Segregation) and Domain-Driven Design (DDD):

- **Commands**: Modify state (Create, Update, Delete listings)
  - Flow: Controller → Command → Command Handler → Repository → PostgreSQL
  - Emits domain events after successful state change

- **Queries**: Read data without modification (Search, Discover)
  - Flow: Controller → Query → Query Handler → Typesense
  - Direct read from optimized search index

### High-Level Architecture

```
Client Applications
       ↓
API Server (NestJS)
   ├── Identity Access Module (Read/Write)
   ├── Listing Management (Write) → PostgreSQL
   └── Listing Discovery (Read) → Typesense
       ↓
BullMQ Queue (Redis)
       ↓
Worker Process → Typesense Index Sync
```

## Project Structure

```
src/
├── app/
│   ├── app.api.module.ts          # API module (main entry)
│   ├── app.worker.module.ts       # Worker module
│   └── di.tokens.ts               # Dependency injection tokens
│
├── infrastructure/                 # Infrastructure providers
│   ├── auth/                      # Better Auth configuration
│   ├── db/drizzle/                # Database schema & client
│   ├── queue/                     # BullMQ providers
│   ├── redis/                     # Redis client
│   ├── typesense/                 # Typesense client
│   └── infrastructure.module.ts
│
├── modules/
│   ├── identity-access/           # Authentication & users
│   ├── listing-management/        # Write model (CQRS commands)
│   └── listing-discovery/         # Read model (CQRS queries)
│
├── shared/
│   ├── auth/                      # Auth utilities & roles
│   ├── config/                    # Configuration module
│   └── logger/                    # Winston logger
│
├── worker/                        # Worker process
│   ├── listing-events.worker.provider.ts
│   └── typesense/listings.indexer.ts
│
├── main.ts                        # API bootstrap
└── worker-main.ts                 # Worker bootstrap
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL
- Redis Stack
- Typesense

### Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Configure environment variables (see .env.example)
```

### Environment Variables

Required environment variables:

```bash
# Application
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres

# Authentication
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_BASE_URL=http://localhost:3000
APP_PUBLIC_URL=http://localhost:3001

# Email (Resend)
RESEND_API_KEY=re-api-key
RESEND_FROM_EMAIL=hello@example.com

# Redis
REDIS_URL=redis://default:[PASSWORD]@[HOST]:[PORT]
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

### Running the Application

#### Development

```bash
# Run API server with auto-reload
npm run start:api:dev

# Run worker with auto-reload
npm run start:worker:dev

# Run type checking
npm run typecheck

# Run linting
npm run lint
```

#### Production

```bash
# Build the project
npm run build

# Start API server
npm run start:prod

# Start worker
npm run start:worker
```

## Database Setup

### Migrations

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

## API Endpoints

### Authentication

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

### Users

| Endpoint          | Method | Auth Required | Description         |
| ----------------- | ------ | ------------- | ------------------- |
| `/users/me`       | GET    | Yes           | Get current user    |
| `/users/public`   | GET    | No            | Public test route   |
| `/users/optional` | GET    | Optional      | Optional auth route |

### Listings (Management - Write Model)

| Endpoint    | Method | Auth Required  | Description    |
| ----------- | ------ | -------------- | -------------- |
| `/listings` | POST   | Admin or Agent | Create listing |
| `/listings` | PATCH  | Admin or Agent | Update listing |
| `/listings` | DELETE | Admin or Agent | Delete listing |

### Listings (Discovery - Read Model)

| Endpoint                     | Method | Auth Required | Description               |
| ---------------------------- | ------ | ------------- | ------------------------- |
| `/public/listings/discovery` | GET    | No            | Browse listings           |
| `/public/listings/search`    | GET    | No            | Full-text semantic search |

### Discovery Parameters

- `page`: Page number (default: 1)
- `perPage`: Items per page (default: 20)
- `sort`: `newest`, `price_asc`, `price_desc` (default: newest)
- `propertyType`: Filter by property type
- `currency`: Filter by currency

### Search Parameters

- `q`: Search query (required)
- `page`: Page number (default: 1)
- `perPage`: Items per page (default: 20)
- `sort`: `relevance`, `newest`, `price_asc`, `price_desc` (default: relevance)
- `propertyType`: Filter by property type
- `currency`: Filter by currency
- `minPrice`: Minimum price filter
- `maxPrice`: Maximum price filter

## Event Flow

The system uses an event-driven architecture for synchronizing the write and read models:

1. **Create/Update/Delete Listing**:
   - Controller receives request
   - Command handler executes
   - Aggregate emits domain event
   - Repository saves to PostgreSQL
   - Event published to BullMQ queue
   - API responds immediately

2. **Worker Processing** (async):
   - Worker pulls job from queue
   - Fetches listing from PostgreSQL
   - Transforms to Typesense document
   - Upserts/Deletes in Typesense
   - Acknowledges job

For detailed event flow and architecture, see [docs/EVENTS_EXPLAINED.md](./docs/EVENTS_EXPLAINED.md).

## Documentation

- [System Overview](./docs/SYSTEM_OVERVIEW.md) - Detailed architecture, module structure, and tech stack
- [Events Explained](./docs/EVENTS_EXPLAINED.md) - Event-driven architecture and workflow diagrams
- [Discovery and Search](./docs/discovery-and-search.md) - Public search capabilities
- [Postman Collection](./docs/postman-collection.json) - API endpoints for testing

## License

MIT
