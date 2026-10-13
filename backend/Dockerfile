FROM node:22-alpine AS build

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY shared ./shared
COPY backend/package.json ./backend/

RUN pnpm install --frozen-lockfile --filter backend...

COPY backend/tsconfig*.json ./backend/
COPY backend/src ./backend/src

RUN pnpm --filter backend build

RUN pnpm --filter backend deploy --prod --legacy /prod

FROM node:22-alpine AS runtime

WORKDIR /app

COPY --from=build /prod ./
COPY --from=build /app/backend/dist ./dist

EXPOSE 3000

CMD ["node", "dist/index.js"]
