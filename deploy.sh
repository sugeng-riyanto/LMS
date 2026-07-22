#!/bin/bash
set -euo pipefail

cd /var/www/lmsshb/physics-command-center

echo "=== 1. Git pull (as aqeela123) ==="
git config --global --add safe.directory /var/www/lmsshb/physics-command-center 2>/dev/null || true
git pull

echo "=== 2. Remove .env.local (all keys are hardcoded, env file causes auth conflicts) ==="
sudo rm -f .env.local

echo "=== 3. Clean build cache ==="
sudo rm -rf .next

echo "=== 4. Stop services & free RAM ==="
sudo pm2 stop lmsshb 2>/dev/null || true
sudo systemctl stop redis-server 2>/dev/null || true

echo "=== 5. Build ==="
sudo SKIP_TYPECHECK=1 NODE_OPTIONS="--max-old-space-size=384" npm run build

echo "=== 6. Start app ==="
sudo pm2 delete all 2>/dev/null || true
sudo PORT=3001 pm2 start npm --name lmsshb -- run start
sudo pm2 save

echo "=== 7. Start redis ==="
sudo systemctl start redis-server 2>/dev/null || true

echo "=== DONE: $(date) ==="
