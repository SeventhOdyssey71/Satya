#!/bin/bash
set -e

echo "Starting Nautilus deployment on instance..."

# Wait for user-data to complete
while [ ! -f "/home/ec2-user/setup-complete.txt" ]; do
  echo "Waiting for initial setup to complete..."
  sleep 10
done

# Source Rust environment
source ~/.cargo/env

# Navigate to project
cd /home/ec2-user/Satya/nautilus-server

# Build the project
echo "Building Nautilus server..."
cargo build --release

# Create systemd service
sudo tee /etc/systemd/system/nautilus-server.service > /dev/null << 'SERVICE_EOF'
[Unit]
Description=Nautilus TEE Server
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/home/ec2-user/Satya/nautilus-server
ExecStart=/home/ec2-user/Satya/nautilus-server/target/release/nautilus-server
Restart=always
RestartSec=10
Environment=RUST_LOG=info
Environment=BIND_ADDRESS=0.0.0.0:8080
StandardOutput=append:/var/log/nautilus-server.log
StandardError=append:/var/log/nautilus-server.log

[Install]
WantedBy=multi-user.target
SERVICE_EOF

# Enable and start the service
sudo systemctl daemon-reload
sudo systemctl enable nautilus-server
sudo systemctl start nautilus-server

# Check status
sleep 5
sudo systemctl status nautilus-server --no-pager

# Test the health endpoint
echo "Testing health endpoint..."
sleep 10
curl -f http://localhost:8080/health || echo "Health check failed, but service may still be starting"

echo "Deployment complete!"
echo "Service status:"
sudo systemctl is-active nautilus-server || true
