FROM node:24-bookworm-slim
WORKDIR /repo
RUN corepack enable
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY backend/package.json backend/package.json
RUN pnpm install --frozen-lockfile --filter shopcart-api
COPY backend/tsconfig.json backend/tsconfig.json
COPY backend/src backend/src
WORKDIR /repo/backend
RUN pnpm build
ENV PUERTO_API=3000
EXPOSE 3000
CMD ["node", "dist/indice.js"]
