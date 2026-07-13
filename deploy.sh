#!/bin/bash
cd /var/www/lmsshb/physics-command-center
sudo git pull
sudo rm -rf .next
sudo SKIP_TYPECHECK=1 NODE_OPTIONS="--max-old-space-size=512" npm run build
sudo pm2 delete all
sudo PORT=3001 pm2 start npm --name lmsshb -- run start
sudo pm2 save
