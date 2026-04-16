#!/usr/bin/env bash

set -euo pipefail

normalize_prefix() {
  local prefix="$1"
  prefix="${prefix#/}"
  prefix="${prefix%/}"
  printf '%s' "$prefix"
}

make_oss_target() {
  local prefix
  prefix="$(normalize_prefix "$1")"

  if [ -n "$prefix" ]; then
    printf 'oss://%s/%s/' "$ALIYUN_OSS_BUCKET" "$prefix"
    return
  fi

  printf 'oss://%s/' "$ALIYUN_OSS_BUCKET"
}

require_env() {
  local missing=()
  local key

  for key in "$@"; do
    if [ -z "${!key:-}" ]; then
      missing+=("$key")
    fi
  done

  if [ "${#missing[@]}" -gt 0 ]; then
    echo "Missing required environment variables:"
    printf -- '- %s\n' "${missing[@]}"
    exit 1
  fi
}

resolve_deploy_flags() {
  if [ -n "${DEPLOY_APP:-}" ]; then
    case "$DEPLOY_APP" in
      h5)
        DEPLOY_H5=true
        DEPLOY_WEB=false
        ;;
      web)
        DEPLOY_H5=false
        DEPLOY_WEB=true
        ;;
      all)
        DEPLOY_H5=true
        DEPLOY_WEB=true
        ;;
      *)
        echo "Unsupported DEPLOY_APP: $DEPLOY_APP"
        exit 1
        ;;
    esac
  else
    DEPLOY_H5="${DEPLOY_H5:-false}"
    DEPLOY_WEB="${DEPLOY_WEB:-false}"
  fi

  if [ "$DEPLOY_H5" != "true" ] && [ "$DEPLOY_WEB" != "true" ]; then
    echo "Nothing selected for deployment."
    exit 1
  fi

  export DEPLOY_H5 DEPLOY_WEB
}

setup_oss_cli_env() {
  require_env ALIYUN_OSS_ACCESS_KEY_ID ALIYUN_OSS_ACCESS_KEY_SECRET ALIYUN_OSS_REGION ALIYUN_OSS_BUCKET

  export OSS_ACCESS_KEY_ID="$ALIYUN_OSS_ACCESS_KEY_ID"
  export OSS_ACCESS_KEY_SECRET="$ALIYUN_OSS_ACCESS_KEY_SECRET"
  export OSS_REGION="$ALIYUN_OSS_REGION"

  OSS_EXTRA_ARGS=()
  if [ -n "${ALIYUN_OSS_ENDPOINT:-}" ]; then
    export OSS_ENDPOINT="$ALIYUN_OSS_ENDPOINT"

    if [[ "$ALIYUN_OSS_ENDPOINT" != *aliyuncs.com* ]]; then
      OSS_EXTRA_ARGS+=(--addressing-style cname)
    fi
  fi

  H5_OSS_TARGET="$(make_oss_target "${ALIYUN_OSS_H5_PREFIX:-h5}")"
  WEB_OSS_TARGET="$(make_oss_target "${ALIYUN_OSS_WEB_PREFIX:-web}")"

  export H5_OSS_TARGET WEB_OSS_TARGET
}
