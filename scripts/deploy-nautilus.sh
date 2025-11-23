#!/bin/bash
set -e

echo "Deploying Nautilus server..."

# Check if instance info exists
if [ ! -f "instance-info.txt" ]; then
  echo "Error: instance-info.txt not found. Run launch-instance.sh first."
  exit 1
fi

# Get instance information
INSTANCE_ID=$(grep "Instance ID:" instance-info.txt | cut -d' ' -f3)
PUBLIC_IP=$(grep "Public IP:" instance-info.txt | cut -d' ' -f3)
SSH_KEY="~/.ssh/nautilus-keypair.pem"

echo "Deploying to instance: $INSTANCE_ID ($PUBLIC_IP)"

# Wait for SSH to be available
echo "Waiting for SSH to be available..."
until ssh -i $SSH_KEY -o ConnectTimeout=5 -o StrictHostKeyChecking=no ec2-user@$PUBLIC_IP "echo 'SSH is ready'" 2>/dev/null
do
  echo "Waiting for SSH..."
  sleep 10
done

echo "SSH is ready, starting deployment..."

# Create deployment script to run on the instance
cat > deploy-script.sh << 'EOF'
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
EOF

# Copy and execute the deployment script
scp -i $SSH_KEY -o StrictHostKeyChecking=no deploy-script.sh ec2-user@$PUBLIC_IP:/tmp/
ssh -i $SSH_KEY -o StrictHostKeyChecking=no ec2-user@$PUBLIC_IP "chmod +x /tmp/deploy-script.sh && /tmp/deploy-script.sh"

# Clean up
rm deploy-script.sh

echo "Deployment completed!"
echo "You can now access your Nautilus server at: http://$PUBLIC_IP:8080"
echo "Health check: http://$PUBLIC_IP:8080/health"
echo ""
echo "To SSH into the instance:"
echo "ssh -i ~/.ssh/nautilus-keypair.pem ec2-user@$PUBLIC_IP"
echo ""
echo "To check logs:"
echo "ssh -i ~/.ssh/nautilus-keypair.pem ec2-user@$PUBLIC_IP 'sudo journalctl -u nautilus-server -f'"