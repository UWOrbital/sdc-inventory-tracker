# Build context is the repo root so the image can include the shared workspace package.
FROM node:22-alpine

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY shared ./shared
COPY frontend/package.json ./frontend/

RUN pnpm install --frozen-lockfile --filter frontend...

COPY frontend ./frontend

WORKDIR /app/frontend

EXPOSE 5173

CMD ["pnpm", "dev", "--host", "0.0.0.0"]
