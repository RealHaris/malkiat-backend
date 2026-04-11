#!/usr/bin/env bash
set -euo pipefail

AWS_REGION="${AWS_REGION:-us-east-1}"
SECRET_ID="${SECRET_ID:-malkiat/prod/app-env}"
ECR_IMAGE_URI="${ECR_IMAGE_URI:-}"

if [[ -z "$ECR_IMAGE_URI" ]]; then
  echo "ECR_IMAGE_URI is required"
  exit 1
fi

APP_DIR="/opt/malkiat/app"
ENV_FILE="$APP_DIR/.env.prod"

mkdir -p "$APP_DIR" /opt/malkiat/typesense-data

aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "${ECR_IMAGE_URI%%/*}"

SECRET_JSON="$(aws secretsmanager get-secret-value --region "$AWS_REGION" --secret-id "$SECRET_ID" --query SecretString --output text)"

python3 - "$ENV_FILE" "$SECRET_JSON" "$ECR_IMAGE_URI" <<'PY'
import json
import pathlib
import sys

env_path = pathlib.Path(sys.argv[1])
secret = json.loads(sys.argv[2])
ecr_image_uri = sys.argv[3]

defaults = {
    "NODE_ENV": "production",
    "PORT": "3000",
    "TYPESENSE_HOST": "typesense",
    "TYPESENSE_PORT": "8108",
    "TYPESENSE_PROTOCOL": "http",
    "TYPESENSE_COLLECTION_LISTINGS": "listings",
    "LISTING_EVENTS_QUEUE_NAME": "listing-events",
}

for key, value in defaults.items():
    secret.setdefault(key, value)

lines = []
for key, value in secret.items():
    text = str(value).replace("\n", "\\n")
    lines.append(f"{key}={text}")

lines.append(f"ECR_IMAGE_URI={ecr_image_uri}")
env_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
PY

cd "$APP_DIR"
docker compose -f docker-compose.prod.yml --env-file .env.prod pull
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --remove-orphans

echo "Deployment complete. Running containers:"
docker compose -f docker-compose.prod.yml --env-file .env.prod ps
