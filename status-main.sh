#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUN_DIR="$ROOT_DIR/.run"
SESSION_NAME="sabahub"

print_status() {
  local name="$1"
  local pid_file="$2"

  if [[ -f "$pid_file" ]]; then
    local pid
    pid="$(cat "$pid_file" 2>/dev/null || true)"
    if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
      echo "$name: RUNNING (pid $pid)"
      return 0
    fi
  fi
  echo "$name: STOPPED"
}

print_status "python-ai" "$RUN_DIR/python-ai.pid"
print_status "backend-spring" "$RUN_DIR/backend.pid"
print_status "frontend" "$RUN_DIR/frontend.pid"

echo
if command -v tmux >/dev/null 2>&1 && tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
  echo "tmux session '$SESSION_NAME': RUNNING"
  echo "Windows:"
  tmux list-windows -t "$SESSION_NAME" -F "- #W"
else
  echo "tmux session '$SESSION_NAME': STOPPED"
fi

echo
echo "Health probes:"
curl -fsS http://127.0.0.1:8090/health >/dev/null 2>&1 && echo "python-ai: OK" || echo "python-ai: DOWN"
curl -fsS http://127.0.0.1:8080/actuator/health >/dev/null 2>&1 && echo "backend: OK" || echo "backend: DOWN"
curl -fsS http://127.0.0.1:3000 >/dev/null 2>&1 && echo "frontend: OK" || echo "frontend: DOWN"
