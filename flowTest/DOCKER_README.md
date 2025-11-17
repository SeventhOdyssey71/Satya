# FlowTest Docker Setup

All Docker configuration and services are now contained within the flowTest directory.

## Quick Start

### 1. Start All Services
```bash
cd /Users/eromonseleodigie/Satya/flowTest
./docker-start.sh
```

This will:
- Build the Docker images
- Start all services (Frontend, TEE Server, Models Server)
- Show service URLs
- Optionally display logs

### 2. Access Services
- **Frontend**: http://localhost:3000
- **TEE Server**: http://localhost:5001
- **Models Server**: http://localhost:8001

### 3. Stop Services
```bash
./docker-stop.sh
```

## Docker Files

```
flowTest/
├── Dockerfile              # Main application Dockerfile
├── Dockerfile.nautilus     # Nautilus server Dockerfile
├── docker-compose.yml      # Service orchestration
├── .dockerignore          # Build exclusions
├── .env                   # Environment variables
├── docker-start.sh        # Start script
├── docker-stop.sh         # Stop script
└── docker-clean.sh        # Cleanup script
```

## Docker Compose Services

### Main Service (default)
- **flowtest-app**: Complete application with all servers

### Optional Services (use profiles)
- **tee-server**: Standalone TEE server
- **models-server**: Standalone Models server
- **nautilus-server**: Nautilus enclave server
- **postgres**: PostgreSQL database
- **redis**: Redis cache

## Commands

### Build Only
```bash
docker-compose build
```

### Start in Background
```bash
docker-compose up -d
```

### Start with Logs
```bash
docker-compose up
```

### View Logs
```bash
docker-compose logs -f
```

### Start Specific Services
```bash
# Start with standalone servers
docker-compose --profile standalone-servers up -d

# Start with enclave
docker-compose --profile enclave up -d

# Start with database
docker-compose --profile database up -d
```

### Check Status
```bash
docker-compose ps
```

### Execute Commands in Container
```bash
# Access main app shell
docker exec -it flowtest-app sh

# Run Python scripts
docker exec flowtest-app python /app/servers/tee_server.py

# View logs
docker exec flowtest-app tail -f /app/logs/app.log
```

## Environment Variables

The `.env` file contains all configuration:
- Network settings (SUI, Walrus, SEAL)
- Server URLs and ports
- Docker-specific settings
- API configurations

## Volumes

Data is persisted in Docker volumes:
- `flowtest-postgres-data`: Database data
- `flowtest-redis-data`: Cache data
- Local mounts for models and datasets

## Troubleshooting

### Port Already in Use
```bash
# Find process using port
lsof -i :3000
# Kill process
kill -9 <PID>
```

### Clean Everything
```bash
./docker-clean.sh
```

### Rebuild Without Cache
```bash
docker-compose build --no-cache
```

### View Container Logs
```bash
docker logs flowtest-app
docker logs flowtest-tee-server
docker logs flowtest-models-server
```

### Access Container Shell
```bash
docker exec -it flowtest-app sh
```

## Development

### Hot Reload
The frontend supports hot reload. Changes to source files will automatically reflect.

### Python Server Development
Python servers can be developed locally and mounted:
```yaml
volumes:
  - ./tee_server.py:/app/servers/tee_server.py:ro
```

### Database Access
```bash
docker exec -it flowtest-db psql -U flowtest -d flowtest_db
```

## Production

For production deployment:

1. Update `.env` with production values
2. Build production image:
   ```bash
   docker build -t flowtest:prod --target production .
   ```
3. Use Docker Swarm or Kubernetes for orchestration
4. Enable health checks and monitoring
5. Use secrets management for sensitive data

## Security Notes

- Never commit `.env` files with real credentials
- Use Docker secrets in production
- Regularly update base images
- Scan images for vulnerabilities:
  ```bash
  docker scan flowtest-app
  ```

## Maintenance

### Update Dependencies
```bash
docker-compose pull
docker-compose build --no-cache
```

### Backup Data
```bash
docker run --rm -v flowtest-postgres-data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-backup.tar.gz /data
```

### Restore Data
```bash
docker run --rm -v flowtest-postgres-data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres-backup.tar.gz -C /
```