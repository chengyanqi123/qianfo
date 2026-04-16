#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# shellcheck source=./deploy-common.sh
source "$SCRIPT_DIR/deploy-common.sh"

cd "$ROOT_DIR"

resolve_deploy_flags
require_env SERVER_USER SERVER_IP

pids=()

if [ "$DEPLOY_H5" = "true" ]; then
  echo "Deploying H5 to server..."
  rsync -avz --delete --exclude='MP_verify_*' -e "ssh -i ~/.ssh/id_rsa" \
    ./apps/h5/dist/ \
    "$SERVER_USER@$SERVER_IP:/www/qianfo/h5" &
  pids+=($!)
fi

if [ "$DEPLOY_WEB" = "true" ]; then
  echo "Deploying Web to server..."
  rsync -avz --delete -e "ssh -i ~/.ssh/id_rsa" \
    ./apps/web/dist/ \
    "$SERVER_USER@$SERVER_IP:/www/qianfo/web" &
  pids+=($!)
fi

for pid in "${pids[@]}"; do
  wait "$pid" || exit 1
done
