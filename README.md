# Independent Book Discovery & Publishing Platform

A curated platform designed to bridge the gap between discerning readers and independent authors, focusing on niche titles, public domain works, and self-published literature.

## Architecture Highlights
- **Backend:** FastAPI (Python) with Modular Monolith structure
- **Frontend:** React + Vite
- **Database:** PostgreSQL (with Full-Text Search)
- **File Storage:** Abstraction layer supporting Local Storage (Development) and S3-Compatible Storage (Production)

## Repository Structure
```text
.
├── backend/          # FastAPI application, database migrations, and unit tests
├── frontend/         # React SPA source code
├── .github/          # GitHub Actions workflows and CI automation
├── nginx/            # Production Nginx configuration
├── docker-compose.yml
├── docker-compose.prod.yml
├── deploy.sh
└── README.md
```

## Quick Start (Development)

```bash
./run.sh
```

Or manually:

```bash
docker compose up -d
docker compose exec backend alembic upgrade head
```

## Production Deployment (VPS)

1. Ensure Docker and Docker Compose are installed on your Linux server.
2. Clone repository and verify your domain points to the server IP.
3. Configure your production secret keys and database password in `backend/.env`:

```bash
POSTGRES_PASSWORD=your_super_secure_password
SECRET_KEY=your_production_jwt_secret_key
```

4. Run the deploy script:

```bash
./deploy.sh
```

5. Obtain SSL Certificates via Certbot:

```bash
docker compose -f docker-compose.prod.yml run --rm certbot certonly \
  --webroot --webroot-path=/var/www/certbot \
  -d yourdomain.com
```

6. Restart web service to load SSL certificates:

```bash
docker compose -f docker-compose.prod.yml restart web
```
