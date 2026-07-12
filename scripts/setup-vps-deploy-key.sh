#!/bin/bash
# Run this ONCE on the VPS to allow GitHub Actions auto-deploy
mkdir -p ~/.ssh
echo 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIDSSRp4m7sckZW8n+AShwMRjxc5V8LENUFv6CmL/QOJ/ github-actions-deploy@lmsshb' >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
echo "✅ Deploy key installed. Now add the private key to GitHub repo secrets as VPS_SSH_KEY"
