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
├── docker-compose.yml
└── README.md