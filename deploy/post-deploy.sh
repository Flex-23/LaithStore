#!/usr/bin/env bash
# Runs on the server, from anywhere, after store-deploy.tar.gz was extracted
# into the project folder (~/my-store).
set -e
cd "$(dirname "$0")/.."

npm ci
npx prisma generate
npx prisma db push

# Turbopack builds reference Prisma through hashed links; recreate them here.
mkdir -p .next/node_modules/@prisma
for name in $(grep -rhoE "@prisma/client-[0-9a-f]+" .next/server .next/build 2>/dev/null | sort -u); do
  ln -sfn "$PWD/node_modules/@prisma/client" ".next/node_modules/$name"
done

echo "Ready. Restart the app (pm2 restart my-store / systemctl restart ...) or run: npm start"
