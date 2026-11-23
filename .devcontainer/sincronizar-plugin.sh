#!/usr/bin/env bash
# Copia o plugin (pasta numep/ do repositório) para dentro do Moodle e atualiza o banco.
# Use sempre que mudar algo no plugin:  bash .devcontainer/sincronizar-plugin.sh
# (Cópia, e não link: o PHP resolve links para o caminho real e os scripts cli/ não acham o config.php.)
set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
MOODLE=/workspaces/moodle

rsync -a --delete "$REPO/numep/" "$MOODLE/public/local/numep/"
if [ "${1:-}" != "--sem-atualizar" ] && [ -f "$MOODLE/config.php" ]; then
  cd "$MOODLE"
  php admin/cli/upgrade.php --non-interactive
  php admin/cli/purge_caches.php
fi
