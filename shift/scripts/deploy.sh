#!/usr/bin/env bash
# Despliegue Shift: rebuild API (opcional), migraciones, generate frontend, restart.
# Uso desde cualquier directorio:
#   /bin_server/docker/shift/scripts/deploy.sh
#   /bin_server/docker/shift/scripts/deploy.sh --frontend-only
#   /bin_server/docker/shift/scripts/deploy.sh --api-only --migrate

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SHIFT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DOCKER_DIR="$(cd "$SHIFT_ROOT/.." && pwd)"
FRONTEND_APP="$SHIFT_ROOT/frontend/app"
COMPOSE=(docker compose -f "$DOCKER_DIR/docker-compose.yml")

DO_API=1
DO_FRONTEND=1
DO_MIGRATE=0
DO_NPM_CI=0
DO_RESTART=1
NO_BUILD=0

usage() {
  cat <<'EOF'
Uso: deploy.sh [opciones]

Despliega Shift en Docker (hub en docker/).

  (sin flags)        API + frontend (build imagen, generate, restart front)
  --api-only         Solo backend: build shift-api, up, opcional migrate
  --frontend-only    Solo frontend: npm run generate + restart shift-frontend
  --migrate          Ejecutar prisma migrate deploy en shift-api
  --no-build         No reconstruir imagen shift-api (solo up -d)
  --npm-ci           npm ci en frontend antes de generate
  --no-restart       No reiniciar contenedores al final
  -h, --help         Esta ayuda

Variables:
  NUXT_PUBLIC_API_BASE  (default: /shift-api)
  NODE_ENV              (default: production)

Ejemplos:
  ./scripts/deploy.sh --migrate
  ./scripts/deploy.sh --frontend-only
  ./scripts/deploy.sh --api-only --migrate --no-build
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --api-only)
      DO_API=1
      DO_FRONTEND=0
      shift
      ;;
    --frontend-only)
      DO_API=0
      DO_FRONTEND=1
      shift
      ;;
    --migrate)
      DO_MIGRATE=1
      shift
      ;;
    --no-build)
      NO_BUILD=1
      shift
      ;;
    --npm-ci)
      DO_NPM_CI=1
      shift
      ;;
    --no-restart)
      DO_RESTART=0
      shift
      ;;
    -h | --help)
      usage
      exit 0
      ;;
    *)
      echo "Opción desconocida: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

log() {
  printf '\n==> %s\n' "$*"
}

wait_shift_db() {
  log "Esperando shift-db…"
  for _ in $(seq 1 30); do
    if "${COMPOSE[@]}" exec -T shift-db pg_isready -U shift_user -d shift_db >/dev/null 2>&1; then
      return 0
    fi
    sleep 2
  done
  echo "shift-db no respondió a tiempo." >&2
  exit 1
}

deploy_api() {
  cd "$DOCKER_DIR"
  if [[ "$NO_BUILD" -eq 0 ]]; then
    log "Build imagen shift-api"
    "${COMPOSE[@]}" build shift-api
  fi
  log "Levantar shift-api"
  "${COMPOSE[@]}" up -d shift-api
  if [[ "$DO_MIGRATE" -eq 1 ]]; then
    wait_shift_db
    log "Prisma migrate deploy"
    "${COMPOSE[@]}" exec -T shift-api npx prisma migrate deploy
  fi
}

deploy_frontend() {
  log "Generate frontend estático"
  cd "$FRONTEND_APP"
  if [[ "$DO_NPM_CI" -eq 1 ]]; then
    npm ci
  elif [[ ! -d node_modules ]]; then
    log "node_modules ausente — ejecutando npm ci"
    npm ci
  fi
  export NODE_ENV="${NODE_ENV:-production}"
  export NUXT_PUBLIC_API_BASE="${NUXT_PUBLIC_API_BASE:-/shift-api}"
  npm run generate
  log "dist actualizado en $FRONTEND_APP/dist"
}

restart_services() {
  cd "$DOCKER_DIR"
  if [[ "$DO_FRONTEND" -eq 1 ]]; then
    log "Restart shift-frontend"
    "${COMPOSE[@]}" restart shift-frontend
  fi
  if [[ "$DO_API" -eq 1 ]]; then
    log "Recreate shift-api (aplica imagen nueva)"
    "${COMPOSE[@]}" up -d shift-api --force-recreate
  fi
}

smoke_check() {
  log "Smoke check API"
  if "${COMPOSE[@]}" exec -T shift-api wget -qO- http://127.0.0.1:3000/health >/dev/null 2>&1; then
    echo "  health OK"
  else
    echo "  advertencia: /health no respondió (revisar logs shift-api)" >&2
  fi
}

main() {
  log "Shift deploy — DOCKER_DIR=$DOCKER_DIR"
  if [[ "$DO_API" -eq 1 ]]; then
    deploy_api
  fi
  if [[ "$DO_FRONTEND" -eq 1 ]]; then
    deploy_frontend
  fi
  if [[ "$DO_RESTART" -eq 1 ]]; then
    restart_services
  fi
  if [[ "$DO_API" -eq 1 ]]; then
    smoke_check
  fi
  log "Listo."
}

main
