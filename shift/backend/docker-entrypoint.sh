#!/bin/sh
set -e

if [ -d "./prisma/migrations" ] && [ -n "$(ls -A ./prisma/migrations 2>/dev/null)" ]; then
  echo "Running prisma migrate deploy..."
  npx prisma migrate deploy
else
  echo "No Prisma migrations yet (F01 or pre-F02); skipping migrate."
fi

if [ -f "./prisma/seed.ts" ] && [ "${SEED_ON_START:-false}" = "true" ]; then
  echo "Running prisma db seed (SEED_ON_START=true)..."
  npx prisma db seed || echo "Seed skipped or failed (non-fatal)."
elif [ -f "./prisma/seed.ts" ]; then
  echo "Skipping prisma db seed (set SEED_ON_START=true to run on container start)."
fi

exec node dist/main.js
