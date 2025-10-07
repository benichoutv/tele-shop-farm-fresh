#!/bin/bash
#
# RSLiv E-commerce - Complete Deployment Script
# For Ubuntu 22.04 LTS with Nginx + PM2 + Let's Encrypt
#
# Usage: 
#   chmod +x deploy.sh
#   sudo ./deploy.sh your-domain.com your-email@example.com
#

set -e  # Exit on any error

# ==========================================
# Configuration
# ==========================================
DOMAIN="${1:-localhost}"
EMAIL="${2:-admin@localhost}"
APP_DIR="/var/www/rsliv"
DATA_DIR="$APP_DIR/data"
UPLOAD_DIR="$APP_DIR/uploads"
NGINX_AVAILABLE="/etc/nginx/sites-available/rsliv"
NGINX_ENABLED="/etc/nginx/sites-enabled/rsliv"
DB_PATH="$DATA_DIR/app.db"

echo "=========================================="
echo "RSLiv Deployment Script"
echo "=========================================="
echo "Domain: $DOMAIN"
echo "Email: $EMAIL"
echo "App directory: $APP_DIR"
echo ""

# ==========================================
# 1. System Prerequisites
# ==========================================
echo "[1/9] Installing system prerequisites..."

# Update system
apt-get update

# Install Node.js 18.x if not present
if ! command -v node &> /dev/null; then
    echo "Installing Node.js 18.x..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

# Install FFmpeg for video processing
if ! command -v ffmpeg &> /dev/null; then
    echo "Installing FFmpeg..."
    apt-get install -y ffmpeg
fi

# Install PM2 globally
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    npm install -g pm2
fi

# Install Nginx
if ! command -v nginx &> /dev/null; then
    echo "Installing Nginx..."
    apt-get install -y nginx
fi

# Install Certbot for Let's Encrypt (skip if domain is localhost)
if [ "$DOMAIN" != "localhost" ] && ! command -v certbot &> /dev/null; then
    echo "Installing Certbot for SSL..."
    apt-get install -y certbot python3-certbot-nginx
fi

echo "✓ Prerequisites installed"

# ==========================================
# 2. Directory Setup
# ==========================================
echo ""
echo "[2/9] Setting up directories..."

# Create directories with proper permissions
mkdir -p "$APP_DIR"
mkdir -p "$DATA_DIR"
mkdir -p "$UPLOAD_DIR"
mkdir -p "$APP_DIR/logs"

# Set ownership
chown -R $SUDO_USER:$SUDO_USER "$APP_DIR"
chmod -R 755 "$UPLOAD_DIR"
chmod -R 755 "$DATA_DIR"

echo "✓ Directories created"

# ==========================================
# 3. Install Dependencies
# ==========================================
echo ""
echo "[3/9] Installing application dependencies..."

cd "$APP_DIR"

# Install production dependencies
npm install --production=false

echo "✓ Dependencies installed"

# ==========================================
# 4. Environment Configuration
# ==========================================
echo ""
echo "[4/9] Configuring environment..."

# Create .env if it doesn't exist
if [ ! -f "$APP_DIR/.env" ]; then
    echo "Creating .env file..."
    
    # Generate secure JWT secret
    JWT_SECRET=$(openssl rand -base64 32)
    
    cat > "$APP_DIR/.env" << EOF
NODE_ENV=production
PORT=3000
APP_BASE_URL=https://$DOMAIN
DB_TYPE=sqlite
DB_PATH=$DB_PATH
UPLOAD_DIR=$UPLOAD_DIR
JWT_SECRET=$JWT_SECRET
TELEGRAM_BOT_TOKEN=YOUR_BOT_TOKEN_HERE
TELEGRAM_ADMIN_CONTACT=@your_username
VITE_API_URL=/api
EOF

    echo "⚠️  .env created with default values"
    echo "⚠️  IMPORTANT: Edit $APP_DIR/.env and set:"
    echo "   - TELEGRAM_BOT_TOKEN (get from @BotFather)"
    echo "   - TELEGRAM_ADMIN_CONTACT (your @username)"
else
    echo "✓ .env already exists"
fi

chown $SUDO_USER:$SUDO_USER "$APP_DIR/.env"
chmod 600 "$APP_DIR/.env"

echo "✓ Environment configured"

# ==========================================
# 5. Database Migration
# ==========================================
echo ""
echo "[5/9] Setting up database..."

# Backup existing database if it exists
if [ -f "$DB_PATH" ]; then
    echo "Backing up existing database..."
    cp "$DB_PATH" "$DB_PATH.backup.$(date +%Y%m%d_%H%M%S)"
fi

# Database will be auto-initialized on first server start
echo "✓ Database setup complete (will initialize on first start)"

# ==========================================
# 6. Build Frontend
# ==========================================
echo ""
echo "[6/9] Building frontend..."

cd "$APP_DIR"
npm run build

echo "✓ Frontend built"

# ==========================================
# 7. PM2 Configuration
# ==========================================
echo ""
echo "[7/9] Configuring PM2..."

# Stop existing PM2 process if running
pm2 delete rsliv-app 2>/dev/null || true

# Start application with PM2
pm2 start ecosystem.config.cjs

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
env PATH=$PATH:/usr/bin pm2 startup systemd -u $SUDO_USER --hp /home/$SUDO_USER

echo "✓ PM2 configured and started"

# ==========================================
# 8. Nginx Configuration
# ==========================================
echo ""
echo "[8/9] Configuring Nginx..."

# Create Nginx configuration
cat > "$NGINX_AVAILABLE" << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name DOMAIN_PLACEHOLDER;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Client body size for file uploads
    client_max_body_size 100M;

    # API endpoints
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeout settings for file uploads
        proxy_connect_timeout 600;
        proxy_send_timeout 600;
        proxy_read_timeout 600;
        send_timeout 600;
    }

    # Uploads directory (static files with caching)
    location /uploads {
        alias UPLOAD_DIR_PLACEHOLDER;
        expires 30d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Frontend static files
    location / {
        root APP_DIR_PLACEHOLDER/dist;
        try_files $uri $uri/ /index.html;
        expires 1h;
        add_header Cache-Control "public";
    }

    # Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
EOF

# Replace placeholders
sed -i "s|DOMAIN_PLACEHOLDER|$DOMAIN|g" "$NGINX_AVAILABLE"
sed -i "s|UPLOAD_DIR_PLACEHOLDER|$UPLOAD_DIR|g" "$NGINX_AVAILABLE"
sed -i "s|APP_DIR_PLACEHOLDER|$APP_DIR|g" "$NGINX_AVAILABLE"

# Enable site
ln -sf "$NGINX_AVAILABLE" "$NGINX_ENABLED"

# Test Nginx configuration
nginx -t

# Reload Nginx
systemctl reload nginx

echo "✓ Nginx configured"

# ==========================================
# 9. SSL Certificate (Let's Encrypt)
# ==========================================
echo ""
echo "[9/9] Setting up SSL..."

if [ "$DOMAIN" != "localhost" ]; then
    echo "Obtaining SSL certificate from Let's Encrypt..."
    echo "⚠️  Make sure your domain $DOMAIN points to this server's IP!"
    read -p "Continue with SSL setup? (y/n) " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email "$EMAIL" --redirect
        echo "✓ SSL certificate installed"
    else
        echo "⚠️  Skipping SSL setup. You can run this later:"
        echo "   sudo certbot --nginx -d $DOMAIN"
    fi
else
    echo "⚠️  Skipping SSL (localhost domain)"
fi

# ==========================================
# Final Status
# ==========================================
echo ""
echo "=========================================="
echo "✓ Deployment Complete!"
echo "=========================================="
echo ""
echo "Application Status:"
pm2 status
echo ""
echo "Access your application:"
if [ "$DOMAIN" != "localhost" ]; then
    echo "  Public URL: https://$DOMAIN"
else
    echo "  Local URL: http://localhost"
fi
echo "  Admin URL: https://$DOMAIN/admin/login"
echo ""
echo "Admin credentials (default):"
echo "  Username: admin"
echo "  Password: admin123"
echo "  ⚠️  CHANGE THESE IN PRODUCTION!"
echo ""
echo "Configuration files:"
echo "  Environment: $APP_DIR/.env"
echo "  PM2 Config: $APP_DIR/ecosystem.config.cjs"
echo "  Nginx Config: $NGINX_AVAILABLE"
echo "  Database: $DB_PATH"
echo ""
echo "Useful commands:"
echo "  pm2 status           - Check app status"
echo "  pm2 logs rsliv-app   - View logs"
echo "  pm2 restart rsliv-app - Restart app"
echo "  nginx -t             - Test Nginx config"
echo "  systemctl reload nginx - Reload Nginx"
echo ""
echo "⚠️  Remember to:"
echo "  1. Edit $APP_DIR/.env with your Telegram bot token"
echo "  2. Change admin password via the admin panel"
echo "  3. Set up firewall rules (UFW recommended)"
echo ""
echo "For troubleshooting, see: DEPLOYMENT_CHECKLIST.md"
echo "=========================================="
