#!/bin/bash
cd /var/www/lmsshb/physics-command-center
sudo git pull
sudo rm -rf .next

# Remove old keys from .env.local (use hardcoded fallbacks instead)
if [ -f .env.local ]; then
  sudo sed -i '/SUPABASE_ANON\|supabase_anon\|SUPABASE_SERVICE_KEY\|supabase_service/d' .env.local
fi

# Free RAM: stop heavy services before build
sudo pm2 stop lmsshb 2>/dev/null
sudo systemctl stop redis-server 2>/dev/null
sudo SKIP_TYPECHECK=1 NODE_OPTIONS="--max-old-space-size=384" npm run build
sudo pm2 delete all 2>/dev/null
sudo PORT=3001 pm2 start npm --name lmsshb -- run start
sudo pm2 save
sudo systemctl start redis-server 2>/dev/null
