#!/bin/bash
set -e
DOMAIN="lmsshb.scangrade.web.id"
EMAIL="aqeelainstruments@gmail.com"

# Copy config
sudo cp deploy/nginx-lmsshb.conf /etc/nginx/sites-available/lmsshb

# Enable site
sudo ln -sf /etc/nginx/sites-available/lmsshb /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and reload
sudo nginx -t && sudo systemctl reload nginx

# SSL
sudo certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "$EMAIL"

echo "SSL installed for https://$DOMAIN"
