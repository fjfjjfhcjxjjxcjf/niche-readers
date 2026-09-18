
---

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
  --webroot --webroot-path=/var/www/certbot -d yourdomain.com
```

6. Restart web service to load SSL certificates:

```bash
docker compose -f docker-compose.prod.yml restart web
```
