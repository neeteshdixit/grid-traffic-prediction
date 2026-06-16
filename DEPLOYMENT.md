# Deployment & DevOps Specification Document (DEPLOYMENT.md)
## Project: Enterprise AI Traffic Demand Prediction System

### Document Control
* **Version**: 1.0.0
* **Date**: June 2, 2026
* **Status**: Approved

---

## 1. Containerization (Dockerfiles)

### 1.1 Backend Dockerfile (`backend.Dockerfile`)
```dockerfile
# Base image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

# Working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend files
COPY . .

# Expose port
EXPOSE 8000

# Start command
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 1.2 Frontend Dockerfile (`frontend.Dockerfile`)
```dockerfile
# Multi-stage build
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production server
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["npm", "start"]
```

---

## 2. Docker Compose Configuration (`docker-compose.yml`)

The compose setup defines the database, backend FastAPI service, frontend client container, and volume configurations.

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: traffic_postgres
    restart: always
    environment:
      POSTGRES_DB: traffic_db
      POSTGRES_USER: traffic_admin
      POSTGRES_PASSWORD: SecurePasswordPostgres123!
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: traffic_backend
    restart: always
    environment:
      - DATABASE_URL=postgresql://traffic_admin:SecurePasswordPostgres123!@postgres:5432/traffic_db
      - SECRET_KEY=09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7
      - ALGORITHM=HS256
      - UPLOAD_DIR=/app/data/uploads
      - MODEL_DIR=/app/data/models
      - PREDICTION_DIR=/app/data/predictions
    ports:
      - "8000:8000"
    volumes:
      - shared_data:/app/data
    depends_on:
      - postgres

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: traffic_frontend
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000
    depends_on:
      - backend

volumes:
  postgres_data:
  shared_data:
```

---

## 3. GitHub Actions CI/CD Pipeline (`ci-cd.yml`)

Save this file in `.github/workflows/ci-cd.yml` to automate static analysis, unit tests, Docker compilation, and deployments:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v3

      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-level: '3.11'
          cache: 'pip'

      - name: Install Backend Deps
        run: |
          python -m pip install --upgrade pip
          pip install flake8 pytest
          if [ -f backend/requirements.txt ]; then pip install -r backend/requirements.txt; fi

      - name: Lint Backend
        run: |
          # stop the build if there are Python syntax errors or undefined names
          flake8 backend --count --select=E9,F63,F7,F82 --show-source --statistics
          # exit-zero treats all errors as warnings
          flake8 backend --count --exit-zero --max-complexity=10 --max-line-length=127 --statistics

      - name: Run Backend Tests
        run: |
          pytest backend/tests

  build-and-push:
    needs: lint-and-test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Checkout Code
        uses: actions/checkout@v3

      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v2
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and Push Backend Image
        uses: docker/build-push-action@v4
        with:
          context: ./backend
          file: ./backend/Dockerfile
          push: true
          tags: ghcr.io/${{ github.repository }}/backend:latest

      - name: Build and Push Frontend Image
        uses: docker/build-push-action@v4
        with:
          context: ./frontend
          file: ./frontend/Dockerfile
          push: true
          tags: ghcr.io/${{ github.repository }}/frontend:latest
```

---

## 4. Production Environment Variables (.env)

Deployments require configuration files. Copy `.env.example` to `.env`:

```bash
# Database Config
DATABASE_URL=postgresql://traffic_admin:SecurePasswordPostgres123!@postgres:5432/traffic_db

# Security Config
SECRET_KEY=09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# File Paths (within backend container)
UPLOAD_DIR=/app/data/uploads
MODEL_DIR=/app/data/models
PREDICTION_DIR=/app/data/predictions

# Client-Facing Configurations
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 5. Deployment Guide

### 5.1 Prerequisites
Ensure the target server has the following packages installed:
* Git
* Docker Engine ($\ge 20.10$)
* Docker Compose V2

### 5.2 Commands for Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/your-org/traffic-prediction.git
   cd traffic-prediction
   ```
2. Configure environmental variables:
   ```bash
   cp .env.example .env
   nano .env # Adjust secrets and ports
   ```
3. Start the application stack:
   ```bash
   docker compose up -d --build
   ```
4. Verify all services are running:
   ```bash
   docker compose ps
   docker compose logs -f backend
   ```
5. Run migrations or initial user seed (optional):
   ```bash
   docker compose exec backend python app/seed_db.py
   ```
