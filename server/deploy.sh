#!/usr/bin/env bash
set -e

IMAGE="prompt-pugalists-server"
CONTAINER="pp-server"
PORT=3000
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "==> Building Docker image (no cache)..."
docker build --no-cache -t "$IMAGE" "$SCRIPT_DIR"

echo "==> Stopping old container (if running)..."
docker rm -f "$CONTAINER" 2>/dev/null || true

echo "==> Starting new container..."
docker run -d \
  --name "$CONTAINER" \
  -p "$PORT:$PORT" \
  --env-file "$SCRIPT_DIR/.env" \
  "$IMAGE"

echo "==> Waiting for health check..."
for i in $(seq 1 10); do
  if curl -sf "http://localhost:$PORT/api/health" > /dev/null 2>&1; then
    echo "==> Server is up on http://localhost:$PORT"
    exit 0
  fi
  sleep 1
done

echo "==> Health check failed. Logs:"
docker logs "$CONTAINER" --tail 30
exit 1
