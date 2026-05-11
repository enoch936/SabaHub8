#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUN_DIR="$ROOT_DIR/.run"
LOG_DIR="$RUN_DIR/logs"
SESSION_NAME="sabahub"
mkdir -p "$LOG_DIR"

PY_PID_FILE="$RUN_DIR/python-ai.pid"
BE_PID_FILE="$RUN_DIR/backend.pid"

require_tmux() {
  if ! command -v tmux >/dev/null 2>&1; then
    echo "[error] tmux is required to run each service in its own terminal window."
    echo "Install tmux and retry: sudo apt-get install -y tmux"
    exit 1
  fi
}

is_running() {
  local pid_file="$1"
  if [[ -f "$pid_file" ]]; then
    local pid
    pid="$(cat "$pid_file" 2>/dev/null || true)"
    if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
      return 0
    fi
  fi
  return 1
}

ensure_session() {
  if ! tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
    tmux new-session -d -s "$SESSION_NAME" -n "bootstrap" "bash"
  fi
}

start_process_tmux() {
  local name="$1"
  local window="$2"
  local workdir="$3"
  local command="$4"
  local pid_file="$5"
  local log_file="$6"

  if is_running "$pid_file"; then
    echo "[skip] $name already running (pid $(cat "$pid_file"))"
    return 0
  fi

  if tmux list-windows -t "$SESSION_NAME" -F '#W' | grep -Fxq "$window"; then
    tmux kill-window -t "$SESSION_NAME:$window" >/dev/null 2>&1 || true
  fi

  echo "[start] $name in tmux window '$window'"
  tmux new-window -d -t "$SESSION_NAME" -n "$window" "cd '$workdir' && $command"
  tmux pipe-pane -o -t "$SESSION_NAME:$window" "cat >> '$log_file'"
  sleep 1

  local pane_pid
  pane_pid="$(tmux list-panes -t "$SESSION_NAME:$window" -F '#{pane_pid}' | head -n1)"
  if [[ -n "$pane_pid" ]] && kill -0 "$pane_pid" 2>/dev/null; then
    echo "$pane_pid" > "$pid_file"
    echo "[ok] $name started (pane pid $pane_pid)"
  else
    echo "[error] failed to start $name."
    exit 1
  fi
}

wait_http() {
  local name="$1"
  local url="$2"
  local max_tries="${3:-60}"
  local sleep_seconds="${4:-1}"

  echo "[wait] $name => $url"
  local i
  for ((i = 1; i <= max_tries; i++)); do
    if curl -fsS "$url" >/dev/null 2>&1; then
      echo "[ok] $name healthy"
      return 0
    fi
    sleep "$sleep_seconds"
  done

  echo "[warn] $name did not become healthy in time"
  return 1
}

require_tmux
ensure_session

start_process_tmux "python-ai" "python-ai" "$ROOT_DIR/ai-python" "exec python3 -m uvicorn app:app --host 127.0.0.1 --port 8090" "$PY_PID_FILE" "$LOG_DIR/python-ai.log"
wait_http "python-ai" "http://127.0.0.1:8090/health" 45 1 || true

start_process_tmux "backend-spring" "backend-spring" "$ROOT_DIR/backend-spring" "exec env AI_ENGINE_PYTHON_ENABLED=true AI_ENGINE_MODE=HYBRID AI_ENGINE_PYTHON_BASE_URL=http://127.0.0.1:8090 ./mvnw -DskipTests spring-boot:run" "$BE_PID_FILE" "$LOG_DIR/backend.log"
wait_http "backend-spring" "http://127.0.0.1:8080/actuator/health" 90 2 || true

if tmux list-windows -t "$SESSION_NAME" -F '#W' | grep -Fxq "bootstrap"; then
  tmux kill-window -t "$SESSION_NAME:bootstrap" >/dev/null 2>&1 || true
fi

echo
echo "Backend + AI are started in tmux session '$SESSION_NAME'."
echo "Attach for live logs: tmux attach -t $SESSION_NAME"
echo "Window names: python-ai, backend-spring"
echo "Logs: $LOG_DIR"
