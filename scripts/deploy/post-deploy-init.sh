#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/opt/malkiat/app"

cd "$APP_DIR"

docker compose -f docker-compose.prod.yml --env-file .env.prod run --rm api npm run db:migrate
docker compose -f docker-compose.prod.yml --env-file .env.prod run --rm api npm run typesense:collection:listings
docker compose -f docker-compose.prod.yml --env-file .env.prod run --rm api npm run typesense:backfill:listings

echo "Post-deploy initialization complete"
