# syntax=docker/dockerfile:1
# Build context: repository root.
FROM node:22-slim AS build
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl python3 make g++ \
    && rm -rf /var/lib/apt/lists/* \
    && corepack enable && corepack prepare pnpm@10.12.4 --activate

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/shared/schema/package.json packages/shared/schema/package.json
COPY packages/shared/static-data/package.json packages/shared/static-data/package.json
COPY packages/shared/utils/package.json packages/shared/utils/package.json
COPY packages/shared/prisma-client/package.json packages/shared/prisma-client/package.json
COPY packages/shared/docs/package.json packages/shared/docs/package.json
COPY apps/backend/package.json apps/backend/package.json
COPY apps/frontend/package.json apps/frontend/package.json

RUN pnpm install --frozen-lockfile

COPY packages/shared packages/shared
COPY apps/backend apps/backend

RUN pnpm --filter backend exec prisma generate \
    && pnpm --filter @shared/schema build \
    && pnpm --filter @shared/utils build \
    && pnpm --filter backend exec tsc -p ../../packages/shared/static-data/tsconfig.json \
    && pnpm --filter backend build

FROM node:22-slim AS runtime
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --gid 912 dnd-tools \
    && useradd --uid 912 --gid 912 --system --no-create-home --shell /usr/sbin/nologin dnd-tools \
    && corepack enable && corepack prepare pnpm@10.12.4 --activate

COPY --from=build /app /app

USER 912:912
WORKDIR /app/apps/backend
ENV NODE_ENV=production
ENV HOME=/tmp
EXPOSE 3001
# ESM directory imports are not runnable via `node dist/`. Call tsx directly
# (not `pnpm exec`) so corepack does not write under a missing home directory.
CMD ["/app/apps/backend/node_modules/.bin/tsx", "src/index.ts"]
