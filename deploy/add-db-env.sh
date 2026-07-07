#!/bin/bash
# Append DB connection to .env.local on VPS
echo 'SUPABASE_DB_CONNECTION=postgresql://postgres:7A%2BJ.%26%3F%23QLf%26Zdf@db.yvnomvcmqsfbkqqjwzhi.supabase.co:5432/postgres' >> /var/www/lmsshb/.env.local
echo "Appended SUPABASE_DB_CONNECTION to .env.local"
