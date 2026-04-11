# AWS EC2 + SSM Production Deployment

This guide deploys `malkiat-backend` to a single EC2 instance using Docker Compose, AWS Secrets Manager, and GitHub Actions with AWS OIDC + SSM.

## Architecture

- One EC2 instance (API + worker + Typesense)
- Supabase PostgreSQL as `DATABASE_URL`
- Managed Redis as `REDIS_URL` and `BULLMQ_REDIS_URL`
- Typesense data persisted at `/opt/malkiat/typesense-data`
- GitHub Actions deploys on push to `production`
- ALB is the reverse proxy in front of EC2

## 0) Security

Rotate any previously exposed Redis password first, then use only the rotated value in Secrets Manager.

## 1) Provision AWS resources with CLI

Run from `malkiat-backend`:

```bash
chmod +x scripts/deploy/aws/setup-prod.sh

AWS_REGION=us-east-1 \
APP_NAME=malkiat \
GITHUB_OWNER=RealHaris \
GITHUB_REPO=malkiat-backend \
GITHUB_BRANCH=production \
INSTANCE_TYPE=t3.large \
./scripts/deploy/aws/setup-prod.sh
```

This creates:

- ECR repo: `malkiat-backend`
- EC2 instance role/profile with SSM + ECR read + Secrets read
- GitHub OIDC deploy role
- EC2 instance + security group
- Secrets Manager secret `malkiat/prod/app-env`

## Current live AWS resources (created)

- Instance ID: `i-0332143e110a204f5`
- Instance type: `m7i-flex.large`
- Instance public IP: `3.237.176.130`
- ALB DNS: `malkiat-api-alb-764099008.us-east-1.elb.amazonaws.com`
- ALB Hosted Zone ID: `Z35SXDOTRQ7X7K`
- Target group: `arn:aws:elasticloadbalancing:us-east-1:915028408783:targetgroup/malkiat-api-tg/d1f082184891642a`
- ACM cert ARN (current): `arn:aws:acm:us-east-1:915028408783:certificate/e19085ec-ae3d-4953-af15-b4ac397b3ebc` for `api.malkiat.site`
- ACM status: `ISSUED`

## 2) Set production secret values

Update the created secret as JSON:

```bash
aws secretsmanager update-secret \
  --region us-east-1 \
  --secret-id malkiat/prod/app-env \
  --secret-string '{
    "DATABASE_URL":"postgresql://...",
    "REDIS_URL":"redis://...",
    "BULLMQ_REDIS_URL":"redis://...",
    "BETTER_AUTH_SECRET":"...",
    "BETTER_AUTH_BASE_URL":"https://api.malkiat.site",
    "APP_PUBLIC_URL":"https://www.malkiat.site",
    "RESEND_API_KEY":"...",
    "RESEND_FROM_EMAIL":"hello@realharis.works",
    "GOOGLE_CLIENT_ID":"...",
    "GOOGLE_CLIENT_SECRET":"...",
    "TYPESENSE_ADMIN_API_KEY":"..."
  }'
```

The deploy workflow auto-adds defaults for:

- `NODE_ENV=production`
- `PORT=3000`
- `TYPESENSE_HOST=typesense`
- `TYPESENSE_PORT=8108`
- `TYPESENSE_PROTOCOL=http`
- `TYPESENSE_COLLECTION_LISTINGS=listings`
- `LISTING_EVENTS_QUEUE_NAME=listing-events`

## 3) Add GitHub repository secrets

In GitHub repo settings, add:

- `AWS_DEPLOY_ROLE_ARN` = output `GITHUB_DEPLOY_ROLE_ARN`
- `AWS_PROD_INSTANCE_ID` = output `INSTANCE_ID`

## 4) Deploy

Merge/push to `production` branch. Workflow file:

- `.github/workflows/deploy-production.yml`

Deploy flow:

1. Build image
2. Push to ECR (`malkiat-backend:<commit_sha>`)
3. Trigger SSM command on EC2 to pull and restart compose stack

## 5) One-time DB + Typesense init

From GitHub Actions `workflow_dispatch`, run with `run_post_deploy_init=true`, or run manually by SSM:

```bash
aws ssm send-command \
  --region us-east-1 \
  --instance-ids <INSTANCE_ID> \
  --document-name AWS-RunShellScript \
  --parameters commands='["set -euo pipefail","cd /opt/malkiat/app","docker compose -f docker-compose.prod.yml --env-file .env.prod run --rm api npm run db:migrate","docker compose -f docker-compose.prod.yml --env-file .env.prod run --rm api npm run typesense:collection:listings","docker compose -f docker-compose.prod.yml --env-file .env.prod run --rm api npm run typesense:backfill:listings"]'
```

## 6) Verify

SSM command for health check:

```bash
aws ssm send-command \
  --region us-east-1 \
  --instance-ids <INSTANCE_ID> \
  --document-name AWS-RunShellScript \
  --parameters commands='["docker ps","curl -i http://localhost"]'
```

Current checks:

- EC2 local health: `GET /users/public` returns `200` with `{"ok":true}`
- ALB health: target is `healthy`
- ALB public HTTP check: `http://malkiat-api-alb-764099008.us-east-1.elb.amazonaws.com/users/public` returns `200`

## Cloudflare DNS records to add

### 1) ACM certificate validation record (must be DNS-only)

- Type: `CNAME`
- Name: `_f9d6fdb92cf03ead93b9e8668d56335f.api.malkiat.site`
- Target: `_dbd7fff195c72ea0adb82eaeed5f2ac0.jkddzztszm.acm-validations.aws`
- Proxy status in Cloudflare: `DNS only` (gray cloud)

### 2) API domain to ALB record

- Type: `CNAME`
- Name: `api`
- Target: `malkiat-api-alb-764099008.us-east-1.elb.amazonaws.com`
- Proxy status in Cloudflare: `DNS only` for ACM validation and initial test. You can later switch to proxied if desired.

For this record, create it under the `malkiat.site` zone.

After ACM becomes `ISSUED`, create HTTPS listener on ALB using that certificate and switch HTTP listener to redirect to HTTPS.

## Rollback

Redeploy previous image tag by editing `ECR_IMAGE_URI` in `/opt/malkiat/app/.env.prod` via SSM and running:

```bash
docker compose -f /opt/malkiat/app/docker-compose.prod.yml --env-file /opt/malkiat/app/.env.prod up -d
```
