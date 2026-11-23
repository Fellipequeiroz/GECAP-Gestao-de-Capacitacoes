#!/usr/bin/env bash
# Roda uma vez, quando o Codespace é criado: baixa o Moodle 5.3, instala no MySQL 8.4,
# copia o plugin local_numep, liga a API REST, grava os dados de exemplo e instala o front.
# Pode rodar de novo sem problema: o que já existe é aproveitado e os dados não são apagados.
set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
MOODLE=/workspaces/moodle
DADOS=/workspaces/moodledata
SENHA_ADMIN='Admin@2026' # só para este ambiente de desenvolvimento

echo ">> Esperando o MySQL 8.4 ficar pronto..."
for _ in $(seq 1 90); do
  if php -r '$c = @new mysqli("db", "moodle", "moodle", "moodle"); exit($c->connect_errno ? 1 : 0);'; then break; fi
  sleep 2
done

if [ ! -d "$MOODLE/.git" ]; then
  echo ">> Baixando o Moodle 5.3..."
  git clone --depth 1 -b MOODLE_503_STABLE https://github.com/moodle/moodle.git "$MOODLE"
fi
cd "$MOODLE"
echo ">> Instalando as dependências do Moodle (composer)..."
composer install --no-dev --no-interaction --classmap-authoritative
mkdir -p "$DADOS"

bash "$REPO/.devcontainer/sincronizar-plugin.sh" --sem-atualizar

if [ ! -f config.php ]; then
  echo ">> Instalando o Moodle (leva alguns minutos)..."
  php admin/cli/install.php --non-interactive --agree-license --lang=pt_br \
    --wwwroot=http://localhost:8080 --dataroot="$DADOS" \
    --dbtype=mysqli --dbhost=db --dbname=moodle --dbuser=moodle --dbpass=moodle --prefix=mdl_ \
    --fullname="GECAP-NUMEP" --shortname="NUMEP" \
    --adminuser=admin --adminpass="$SENHA_ADMIN" --adminemail=admin@numep.localhost --supportemail=admin@numep.localhost
  php public/local/numep/cli/configurar_api.php
  echo ">> Gravando os dados de exemplo..."
  php public/local/numep/cli/dados_exemplo.php --confirmar
else
  # Já instalado: só atualiza (os dados existentes são mantidos).
  php admin/cli/upgrade.php --non-interactive
  php public/local/numep/cli/configurar_api.php
fi

echo ">> Instalando o front..."
cd "$REPO/front"
npm install

echo
echo "Pronto. Abra a porta 5173 (Front GECAP) e entre com:"
echo "  ana.ferreira@assistenciasocial.gov.br / Numep@2026"
echo "Admin do Moodle (só pelo terminal): admin / $SENHA_ADMIN"
