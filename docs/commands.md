# Malikiyat Backend - Local Commands (Typesense + Supabase)

This project uses:
- Typesense (self-hosted locally via Docker)
- Supabase (cloud project via Supabase CLI)

Use these commands from `malkiat-backend/`.

## 1) Typesense Docker (official image)

Official image from Typesense docs: `typesense/typesense:30.1`

```bash
mkdir -p typesense-data

docker pull typesense/typesense:30.1

docker run -d --name "typesense-malkiat" -p 8108:8108 \
  -v "$(pwd)/typesense-data:/data" \
  typesense/typesense:30.1 \
  --data-dir /data \
  --api-key="$TYPESENSE_ADMIN_API_KEY" \
  --enable-cors
```

### Start / Stop / Restart / Remove

```bash
docker start typesense-malkiat
docker stop typesense-malkiat
docker restart typesense-malkiat
docker rm -f typesense-malkiat
```

### Logs and Health

```bash
docker logs -f typesense-malkiat

curl -sS http://localhost:8108/health
curl -sS -H "X-TYPESENSE-API-KEY: $TYPESENSE_ADMIN_API_KEY" http://localhost:8108/debug
```

## 2) Typesense CLI (`@clera/typesense-cli`)

```bash
npm install -g @clera/typesense-cli
```

Set CLI env vars:

```bash
export TYPESENSE_HOST=localhost
export TYPESENSE_PORT=8108
export TYPESENSE_PROTOCOL=http
export TYPESENSE_ADMIN_KEY="$TYPESENSE_ADMIN_API_KEY"
```

Common CLI checks:

```bash
typesense-cli health
typesense-cli debug
typesense-cli collections list --json
```

## 3) Backend Typesense scripts

Create/recreate listings collection:

```bash
npm run typesense:collection:listings
```

Backfill listings into Typesense (needs a valid `DATABASE_URL`):

```bash
npm run typesense:backfill:listings
```

## 4) Supabase CLI (cloud only)

Install CLI:

```bash
brew install supabase/tap/supabase
supabase --version
```

Authenticate and verify:

```bash
supabase login
supabase projects list
```

Link this repo to your cloud project:

```bash
supabase link --project-ref zhqynrapowftokemdniw
```

Get cloud API keys via CLI:

```bash
supabase projects api-keys --project-ref zhqynrapowftokemdniw
```

## 5) Supabase Studio

For this project, use cloud Studio (no local stack required):

- `https://supabase.com/dashboard/project/zhqynrapowftokemdniw`

If you intentionally run local Supabase in future, local Studio is usually:

- `http://localhost:54323`

## 6) Typesense Dashboard / UI

For self-hosted Typesense, there is no official Typesense-hosted self-host dashboard image documented in official docs.

Official dashboard from Typesense is Typesense Cloud Admin Dashboard:

- `https://cloud.typesense.org`

For local self-hosted Typesense, use:
- API endpoints (`/health`, `/debug`)
- `typesense-cli`
- your app-level scripts (`typesense:collection:listings`, `typesense:backfill:listings`)
