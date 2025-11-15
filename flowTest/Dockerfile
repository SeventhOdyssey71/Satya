# FlowTest Multi-Stage Docker Build
# This Dockerfile builds the complete flowTest application

# Stage 1: Build the Next.js application
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY yarn.lock* ./
COPY pnpm-lock.yaml* ./

# Install dependencies
RUN npm ci --only=production || yarn install --frozen-lockfile || pnpm install --frozen-lockfile

# Copy application code
COPY . .

# Build the Next.js application
RUN npm run build

# Stage 2: Python servers setup
FROM python:3.10-slim AS python-servers

WORKDIR /servers

# Install Python dependencies
RUN pip install --no-cache-dir \
    fastapi \
    uvicorn \
    numpy \
    scikit-learn \
    joblib \
    pydantic \
    python-multipart \
    aiofiles

# Copy Python server files
COPY tee_server.py ./
COPY tiny_models_server.py ./
COPY real_attestation_generator.py ./

# Copy model and dataset directories
COPY tiny_models ./tiny_models
COPY tiny_datasets ./tiny_datasets

# Stage 3: Final production image
FROM node:18-alpine

# Install Python for running ML servers
RUN apk add --no-cache python3 py3-pip

WORKDIR /app

# Copy built Next.js application from builder
COPY --from=frontend-builder /app/.next ./.next
COPY --from=frontend-builder /app/node_modules ./node_modules
COPY --from=frontend-builder /app/package.json ./package.json
COPY --from=frontend-builder /app/public ./public

# Copy Python servers and dependencies
COPY --from=python-servers /servers /app/servers
COPY --from=python-servers /usr/local/lib/python3.10/site-packages /usr/local/lib/python3.10/site-packages

# Copy configuration files
COPY .env.local .env.local
COPY .env .env
COPY start_servers.sh ./
COPY stop_servers.sh ./

# Copy server directories
COPY nautilus-server ./nautilus-server
COPY tiny_models ./tiny_models
COPY tiny_datasets ./tiny_datasets

# Make scripts executable
RUN chmod +x start_servers.sh stop_servers.sh

# Expose ports
EXPOSE 3000 5001 8001

# Create startup script
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'cd /app/servers && python3 tee_server.py &' >> /app/start.sh && \
    echo 'cd /app/servers && python3 tiny_models_server.py &' >> /app/start.sh && \
    echo 'cd /app && npm start' >> /app/start.sh && \
    chmod +x /app/start.sh

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Default command
CMD ["/app/start.sh"]