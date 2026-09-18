#!/usr/bin/env bash
set -e

echo "=== Deploying Book Discovery & Publishing Platform ==="

# Check environment file
if [ ! -f "backend/.env" ]; then
    echo "ERROR: backend/.env missing! Copy from backend/.env.example and configure production credentials."
    exit 1
fi

echo "1. Building production images and starting containers..."
docker compose -f docker-compose.prod.yml up --build -d

echo "2. Applying database migrations via Alembic..."
docker compose -f docker-compose.prod.yml exec -T backend alembic upgrade head

echo "=== Deployment Completed Successfully ==="
echo "App is active on ports 80 / 443."
