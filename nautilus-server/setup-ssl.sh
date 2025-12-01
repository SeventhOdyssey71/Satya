#!/bin/bash
# SSL Setup for Nautilus Server on AWS/Cloud Instance
# This configures nginx reverse proxy with Let's Encrypt SSL

echo "🔒 Setting up SSL for Nautilus Server"

# Prerequisites check
if [ "$EUID" -ne 0 ]; then
  echo "❌ Please run as root (sudo)"
  exit 1
fi

# Install nginx and certbot
echo "📦 Installing nginx and certbot..."
apt-get update
apt-get install -y nginx certbot python3-certbot-nginx

# Create nginx configuration
echo "⚙️  Creating nginx configuration..."
cat > /etc/nginx/sites-available/nautilus <<'EOF'
# Nautilus TEE Server - HTTPS Configuration
upstream nautilus_backend {
    server 127.0.0.1:3333;
}

server {
    listen 80;
    server_name YOUR_DOMAIN_HERE;  # Change this!

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name YOUR_DOMAIN_HERE;  # Change this!

    # SSL certificates (will be added by certbot)
    # ssl_certificate /etc/letsencrypt/live/YOUR_DOMAIN/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/YOUR_DOMAIN/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # CORS headers for your frontend
    add_header Access-Control-Allow-Origin "https://www.satyaprotocol.com" always;
    add_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-API-Key" always;

    # Handle preflight requests
    if ($request_method = 'OPTIONS') {
        add_header Access-Control-Allow-Origin "https://www.satyaprotocol.com";
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
        add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-API-Key";
        add_header Access-Control-Max-Age 86400;
        add_header Content-Length 0;
        return 204;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req zone=api_limit burst=20 nodelay;

    # Proxy configuration
    location / {
        proxy_pass http://nautilus_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts for long-running evaluations
        proxy_connect_timeout 600s;
        proxy_send_timeout 600s;
        proxy_read_timeout 600s;
    }

    # Increase max body size for model uploads
    client_max_body_size 1G;
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/nautilus /etc/nginx/sites-enabled/

echo ""
echo "📝 IMPORTANT: Edit /etc/nginx/sites-available/nautilus"
echo "   Replace 'YOUR_DOMAIN_HERE' with your actual domain (e.g., api.satyaprotocol.com)"
echo ""
read -p "Enter your domain name: " DOMAIN

# Update domain in config
sed -i "s/YOUR_DOMAIN_HERE/$DOMAIN/g" /etc/nginx/sites-available/nautilus

# Test nginx configuration
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx configuration valid"

    # Restart nginx
    systemctl restart nginx
    systemctl enable nginx

    echo ""
    echo "🔐 Now running certbot to get SSL certificate..."
    echo "   This will ask for your email and agree to terms"
    echo ""

    # Get SSL certificate
    certbot --nginx -d $DOMAIN

    echo ""
    echo "✅ SSL setup complete!"
    echo ""
    echo "Your Nautilus server is now accessible at:"
    echo "   https://$DOMAIN"
    echo ""
    echo "Update your frontend to use:"
    echo "   NEXT_PUBLIC_TEE_SERVER_URL=https://$DOMAIN"
else
    echo "❌ Nginx configuration error. Please check the config."
    exit 1
fi
