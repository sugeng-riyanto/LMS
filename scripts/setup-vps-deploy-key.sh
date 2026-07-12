#!/bin/bash
# Run this ONCE on the VPS to allow GitHub Actions auto-deploy
mkdir -p ~/.ssh
echo 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGbG1c/N9W4xsLkHu5X9CbZ6zqgxhhr3EOl+vggs5w1L github-actions-deploy@lmsshb' >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
echo "✅ Deploy key installed. Now add the private key to GitHub repo secrets as VPS_SSH_KEY"
