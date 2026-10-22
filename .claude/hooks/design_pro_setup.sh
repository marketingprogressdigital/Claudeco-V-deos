#!/bin/bash
# Prepara o DESIGN PRO no início da sessão: instala as dependências do motor se faltarem
# e, se houver um Chromium já instalado (nuvem do Claude Code), aponta o motor para ele.
set -uo pipefail
MOTOR="${CLAUDE_PROJECT_DIR:-$(pwd)}/DESIGN_PRO/motor"
[ -d "$MOTOR" ] || exit 0
command -v npm >/dev/null 2>&1 || { echo "DESIGN PRO: Node.js ausente, motor não preparado"; exit 0; }
if [ ! -d "$MOTOR/node_modules" ]; then
  (cd "$MOTOR" && npm ci --no-audit --no-fund >/dev/null 2>&1) && echo "DESIGN PRO: dependências instaladas" || echo "DESIGN PRO: falha ao instalar dependências (rode npm ci em DESIGN_PRO/motor)"
fi
if [ -x /opt/pw-browsers/chromium ] && [ -n "${CLAUDE_ENV_FILE:-}" ]; then
  echo "export DESIGN_PRO_CHROMIUM=/opt/pw-browsers/chromium" >> "$CLAUDE_ENV_FILE"
fi
exit 0
