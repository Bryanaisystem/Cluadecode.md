#!/usr/bin/env bash
# One-time setup for the GCP VM screenshot API. Run section by section, not blindly —
# some steps require you to SSH in between (marked below). Fill in the bracketed values
# before running.

set -euo pipefail

PROJECT_ID="cwv-lessons"
INSTANCE_NAME="[INSTANCE_NAME]"
ZONE="[ZONE]"
SERVICE_ACCOUNT_EMAIL="[SERVICE_ACCOUNT_EMAIL]"

# --- Step 1: attach service account + restart VM (run locally, gcloud CLI required) ---
gcloud config set project "$PROJECT_ID"
gcloud compute instances stop "$INSTANCE_NAME" --zone "$ZONE"
gcloud compute instances set-service-account "$INSTANCE_NAME" \
  --zone "$ZONE" \
  --service-account "$SERVICE_ACCOUNT_EMAIL" \
  --scopes https://www.googleapis.com/auth/cloud-platform
gcloud compute instances start "$INSTANCE_NAME" --zone "$ZONE"

# --- Step 2: open firewall for port 3333 (run locally) ---
gcloud compute firewall-rules create allow-screenshot-api-3333 \
  --direction=INGRESS --priority=1000 --network=default --action=ALLOW \
  --rules=tcp:3333 --source-ranges=0.0.0.0/0 --target-tags=screenshot-api
gcloud compute instances add-tags "$INSTANCE_NAME" --zone "$ZONE" --tags screenshot-api
# NOTE: 0.0.0.0/0 is wide open — restrict --source-ranges to your own IP if you want this locked down.

# --- Step 3: SSH into the VM, then run the rest manually ---
# sudo apt update && sudo apt upgrade -y
# sudo apt install -y python3 python3-venv python3-pip chromium \
#   libnss3 libatk1.0-0 libatk-bridge2.0-0 libxkbcommon0 libxdamage1 \
#   libxrandr2 libgbm1 libasound2t64 curl unzip nodejs npm
# which chromium   # confirm this returns a path, e.g. /usr/bin/chromium

# --- Step 4: create project + python env (on the VM) ---
# mkdir -p ~/screenshot-api && cd ~/screenshot-api
# python3 -m venv venv
# source venv/bin/activate
# pip install --upgrade pip
# pip install fastapi uvicorn playwright google-cloud-storage pydantic
# playwright install chromium

# --- Step 5: copy infra/screenshot-api/app.py onto the VM as ~/screenshot-api/app.py ---

# --- Step 6: run with PM2 (on the VM) ---
# sudo npm install -g pm2
# pm2 start ecosystem.config.cjs   # copy infra/screenshot-api/ecosystem.config.cjs first, fill in [USER]
# pm2 save

# --- Step 7: test (from anywhere) ---
# curl -X POST http://<vm-external-ip>:3333/screenshot \
#   -H "Content-Type: application/json" \
#   -d '{"urls":["https://google.com"]}'
