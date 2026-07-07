#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR"
APP_NAME="lmsshb"
PORT=3001
DOMAIN="lmsshb.scangrade.web.id"
SUPABASE_URL="https://yvnomvcmqsfbkqqjwzhi.supabase.co"

echo "================================================"
echo " SHB LMS — VPS Setup for $DOMAIN"
echo "================================================"
echo ""

# ── Check root ──
if [ "$EUID" -ne 0 ]; then
  echo "Run as root: sudo bash setup-vps.sh"
  exit 1
fi

# ── 1. System update + deps ──
echo "[1/7] Updating system packages..."
apt update -y && apt upgrade -y
apt install -y curl nginx certbot python3-certbot-nginx git

# ── 2. Swap (1GB RAM needs swap for build) ──
echo "[2/7] Setting up 2GB swap..."
if ! swapon --show | grep -q /swapfile; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
  echo "Swap created (2GB)"
else
  echo "Swap already active"
fi

# ── 3. Node.js 20 + PM2 ──
echo "[3/7] Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
npm install -g pm2

echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"
echo "PM2 version: $(pm2 -v)"

# ── 4. Environment variables ──
echo "[4/7] Setting up environment variables..."
ENV_FILE="$PROJECT_DIR/.env.local"

if [ ! -f "$ENV_FILE" ]; then
  cat > "$ENV_FILE" << 'ENVEOF'
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ENVEOF
  echo ""
  echo "================================================"
  echo "  EDIT .env.local WITH YOUR KEYS"
  echo "================================================"
  echo ""
  echo "  Run this command now:"
  echo "    nano $ENV_FILE"
  echo ""
  echo "  Paste your Supabase keys, then Ctrl+X, Y, Enter"
  echo ""
  echo "  AFTER DONE, press ENTER to continue..."
  read -r
else
  echo ".env.local already exists, skipping"
fi

# ── 5. Install deps + build ──
echo "[5/7] Installing dependencies..."
cd "$PROJECT_DIR"
npm install

echo ""
echo "Building Next.js (this may take 3-5 minutes)..."
npm run build

# ── 6. PM2 start ──
echo "[6/7] Starting app with PM2..."
pm2 delete "$APP_NAME" 2>/dev/null || true
PORT=$PORT pm2 start npm --name "$APP_NAME" -- start -- -p "$PORT"
pm2 save
pm2 startup systemd -u root --hp /root

# ── 7. Nginx reverse proxy + SSL ──
echo "[7/7] Configuring Nginx..."
NGINX_CONF="/etc/nginx/sites-available/$APP_NAME"

cat > "$NGINX_CONF" << 'NGINXEOF'
server {
    listen 80;
    server_name DOMAIN_PLACEHOLDER;

    # Security headers for Next.js
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;
    gzip_proxied any;
    gzip_min_length 1000;

    location / {
        proxy_pass http://127.0.0.1:PORT_PLACEHOLDER;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Increase body size for file upload
        client_max_body_size 50m;
    }

    # Next.js static assets
    location /_next/static {
        proxy_pass http://127.0.0.1:PORT_PLACEHOLDER;
        proxy_cache_bypass $http_upgrade;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
NGINXEOF

sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" "$NGINX_CONF"
sed -i "s/PORT_PLACEHOLDER/$PORT/g" "$NGINX_CONF"

# Enable site
ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

nginx -t && systemctl reload nginx

# SSL via Certbot
echo ""
echo "================================================"
echo "  SSL Certificate (Let's Encrypt)"
echo "================================================"
echo ""
certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "aqeelainstruments@gmail.com"

# ── Done ──
echo ""
echo "================================================"
echo "  ✅ SETUP COMPLETE"
echo "================================================"
echo ""
echo "  App: https://$DOMAIN"
echo "  PM2 status: pm2 status"
echo "  PM2 logs: pm2 logs $APP_NAME"
echo "  Restart: pm2 restart $APP_NAME"
echo "  Build dir: $PROJECT_DIR"
echo ""
echo "  ⚠️  SUPABASE CORS — Add these NOW:"
echo "     https://supabase.com/dashboard/project/yvnomvcmqsfbkqqjwzhi"
echo "     Authentication → Settings → Site URL:"
echo "       https://$DOMAIN"
echo "     Redirect URLs:"
echo "       https://$DOMAIN/**"
echo ""
echo "  git pull + redeploy:"
echo "    cd $PROJECT_DIR && git pull && npm run build && pm2 restart $APP_NAME"
echo ""
echo "================================================"
