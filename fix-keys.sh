#!/bin/bash
set -e
ANON="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2bm9tdmNtcXNmYmtxcWp3emhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3NjM0NzQsImV4cCI6MjA5ODMzOTQ3NH0.QBpmyNnEFxzMXoxEjQY16cOYNUUbK0I3oUU0GwjJBX0"
SRV="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2bm9tdmNtcXNmYmtxcWp3emhpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Mjc2MzQ3NCwiZXhwIjoyMDk4MzM5NDc0fQ.kURnxdJms7u6G1wkbApW7D8pAXCN96J2OSjQino5YFc"
URL="https://yvnomvcmqsfbkqqjwzhi.supabase.co"
for f in src/lib/supabase/client.ts src/lib/supabase/supabase-config.ts; do
  sed -i "s|FALLBACK_ANON_KEY = '.*'|FALLBACK_ANON_KEY = '$ANON'|" "$f"
done
sed -i "s|FALLBACK_SERVICE_KEY = '.*'|FALLBACK_SERVICE_KEY = '$SRV'|" src/lib/supabase/supabase-config.ts
sed -i "s|FALLBACK_URL = '.*'|FALLBACK_URL = '$URL'|" src/lib/supabase/supabase-config.ts
sed -i "s|FALLBACK_URL = '.*'|FALLBACK_URL = '$URL'|" src/lib/supabase/client.ts
echo "Keys fixed. Building..."
sudo rm -rf .next
SKIP_TYPECHECK=1 NODE_OPTIONS="--max-old-space-size=512" npm run build
sudo pm2 restart lmsshb --update-env
echo "Done!"
