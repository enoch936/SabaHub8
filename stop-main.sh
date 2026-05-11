#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUN_DIR="$ROOT_DIR/.run"
SESSION_NAME="sabahub"

stop_pid_file() {
  local name="$1"
  local pid_file="$2"

  if [[ ! -f "$pid_file" ]]; then
    echo "[skip] $name not running (no pid file)"
    return 0
  fi

  local pid
  pid="$(cat "$pid_file" 2>/dev/null || true)"
  if [[ -z "$pid" ]]; then
    echo "[skip] $name pid file empty"
    rm -f "$pid_file"
    return 0
  fi

  if kill -0 "$pid" 2>/dev/null; then
    echo "[stop] $name (pid $pid)"
    kill "$pid" 2>/dev/null || true
    sleep 2
    if kill -0 "$pid" 2>/dev/null; then
      echo "[force] $name (pid $pid)"
      kill -9 "$pid" 2>/dev/null || true
    fi
  else
    echo "[skip] $name process $pid not alive"
  fi

  rm -f "$pid_file"
}

stop_pid_file "frontend" "$RUN_DIR/frontend.pid"
stop_pid_file "backend-spring" "$RUN_DIR/backend.pid"
stop_pid_file "python-ai" "$RUN_DIR/python-ai.pid"

if command -v tmux >/dev/null 2>&1 && tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
  echo "[stop] tmux session $SESSION_NAME"
  tmux kill-session -t "$SESSION_NAME" || true
fi

echo "All main project processes stopped."
