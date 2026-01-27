# Docker Deployment Guide

This guide explains how to build and deploy the Radio Management application using Docker.

## Files Overview

- **Dockerfile**: Multi-stage build for production deployment
- **docker-compose.yml**: Orchestration file for running the container
- **.dockerignore**: Files to exclude from Docker build context
- **.dockerenv.example**: Template for environment variables

## Prerequisites

- Docker (version 20.10+)
- Docker Compose (version 1.29+)
- Environment variables configured

## Quick Start

### 1. Environment Variables

Your `.env.production` file is already configured with all required variables:
- Convex deployment URL
- Clerk authentication keys
- Clerk webhook secrets

The Docker setup will automatically use this file.

### 2. Build the Docker Image

```bash
# Using docker compose (recommended)
docker-compose build

# Or using docker directly
docker build -t radio-managment:latest .
```

### 3. Run the Container

```bash
# Using docker compose
docker-compose up -d

# Or using docker directly
docker run -d \
  --name radio-managment \
  -p 3000:3000 \
  --env-file .env.production \
  radio-managment:latest
```

### 4. Verify It's Running

```bash
# Check container status
docker ps

# View logs
docker compose logs -f app
# or
docker logs -f radio-managment

# Test the application
curl http://localhost:3000
```

## Configuration

### Environment Variables

Place required environment variables in `.env.production`:

```env
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
```

### Port Configuration

The container exposes port 3000. To use a different port:

```bash
docker run -p 8080:3000 radio-managment:latest
```

Then access the app at `http://localhost:8080`

## Docker Compose Commands

```bash
# Start the application
docker-compose up -d

# Stop the application
docker-compose down

# View logs
docker-compose logs -f

# Restart the application
docker-compose restart

# Rebuild the image
docker-compose build --no-cache
```

## Production Deployment

### Best Practices

1. **Use specific tag versions** instead of `latest`
   ```bash
   docker build -t radio-managment:v1.0.0 .
   ```

2. **Enable resource limits** in docker-compose.yml (uncomment the deploy section)

3. **Set up proper logging**
   ```yaml
   logging:
     driver: "json-file"
     options:
       max-size: "10m"
       max-file: "3"
   ```

4. **Use a reverse proxy** (nginx, Traefik) for SSL/TLS

5. **Keep images clean** by using `.dockerignore`

### Kubernetes Deployment

If deploying to Kubernetes, you can use the Docker image with standard k8s manifests:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: radio-managment
spec:
  containers:
  - name: app
    image: radio-managment:latest
    ports:
    - containerPort: 3000
    envFrom:
    - configMapRef:
        name: radio-managment-config
```

## Troubleshooting

### Container exits immediately

Check logs for errors:
```bash
docker logs radio-managment
```

Common issues:
- Missing environment variables → Set them in `.env.production`
- Build errors → Run `docker build --no-cache -t radio-managment:latest .`

### Port already in use

Change the port mapping:
```bash
docker run -p 8000:3000 radio-managment:latest
```

### High memory usage

Implement resource limits in `docker-compose.yml` or run with:
```bash
docker run -m 512m radio-managment:latest
```

## Health Check

The container includes a built-in health check that runs every 30 seconds. Check status:

```bash
docker inspect --format='{{.State.Health.Status}}' radio-managment
```

## Cleaning Up

```bash
# Remove stopped containers
docker container prune

# Remove unused images
docker image prune

# Remove everything (use with caution)
docker system prune -a
```

## Support

For issues with the application, check:
1. Application logs: `docker logs -f radio-managment`
2. Environment variables are correctly set
3. All external services (Convex, Clerk) are accessible
