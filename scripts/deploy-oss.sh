#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# shellcheck source=./deploy-common.sh
source "$SCRIPT_DIR/deploy-common.sh"

cd "$ROOT_DIR"

resolve_deploy_flags
setup_oss_cli_env

pids=()

if [ "$DEPLOY_H5" = "true" ]; then
  echo "Deploying H5 to OSS: $H5_OSS_TARGET"
  ossutil sync ./apps/h5/dist/ "$H5_OSS_TARGET" --delete --exclude "MP_verify_*" -f --checkpoint-dir /tmp/ossutil-h5-checkpoint "${OSS_EXTRA_ARGS[@]}" &
  pids+=($!)
fi

if [ "$DEPLOY_WEB" = "true" ]; then
  echo "Deploying Web to OSS: $WEB_OSS_TARGET"
  ossutil sync ./apps/web/dist/ "$WEB_OSS_TARGET" --delete -f --checkpoint-dir /tmp/ossutil-web-checkpoint "${OSS_EXTRA_ARGS[@]}" &
  pids+=($!)
fi

for pid in "${pids[@]}"; do
  wait "$pid" || exit 1
done
