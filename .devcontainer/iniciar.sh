#!/usr/bin/env bash
# Roda a cada início do Codespace: liga o Moodle (porta 8080) e o front (porta 5173) em segundo plano.
# Registros: /tmp/moodle.log e /tmp/front.log
REPO="$(cd "$(dirname "$0")/.." && pwd)"
MOODLE=/workspaces/moodle

if [ ! -f "$MOODLE/config.php" ]; then
  echo "Moodle ainda não instalado. Rode: bash .devcontainer/instalar-moodle.sh"
  exit 0
fi

pgrep -f "php -S 0.0.0.0:8080" > /dev/null || \
  setsid nohup php -S 0.0.0.0:8080 -t "$MOODLE/public" > /tmp/moodle.log 2>&1 < /dev/null &

pgrep -f "vite" > /dev/null || \
  (cd "$REPO/front" && setsid nohup npm run dev -- --host 0.0.0.0 > /tmp/front.log 2>&1 < /dev/null &)

echo "Moodle: porta 8080 | Front: porta 5173"
