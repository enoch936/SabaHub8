#!/usr/bin/env bash
set -euo pipefail

# This script starts the streaming infrastructure using podman since docker-compose is unavailable.

HLS_DATA_DIR="/tmp/sabahub-hls"
mkdir -p "$HLS_DATA_DIR"

echo "[start] HLS Origin (Nginx) on port 8081"
podman rm -f sabahub-hls-origin >/dev/null 2>&1 || true
podman run -d \
  --name sabahub-hls-origin \
  -p 8081:80 \
  -v ./infra/streaming/nginx-hls.conf:/etc/nginx/conf.d/default.conf:ro \
  -v "$HLS_DATA_DIR":/var/www/hls:ro \
  docker.io/library/nginx:1.27-alpine

echo "[start] MediaMTX on port 1935 (RTMP) and 9997 (API)"
podman rm -f sabahub-mediamtx >/dev/null 2>&1 || true
podman run -d \
  --name sabahub-mediamtx \
  -p 1935:1935 \
  -p 9997:9997 \
  -v ./infra/streaming/mediamtx.yml:/mediamtx.yml:ro \
  docker.io/bluenviron/mediamtx:1.8.4

echo "[ok] Streaming infrastructure started."
echo "HLS data directory: $HLS_DATA_DIR"
echo "Nginx now has a fallback for missing .m3u8 files to return a default #EXTM3U manifest."
