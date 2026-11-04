FROM node:24-bookworm-slim AS build
WORKDIR /repo
RUN corepack enable
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY frontend/package.json frontend/package.json
COPY backend/package.json backend/package.json
COPY frontend frontend
RUN pnpm install --frozen-lockfile --filter frontend...
ENV VITE_API_URL=
RUN pnpm --dir frontend build

FROM nginx:1.27-alpine
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/frontend/dist /usr/share/nginx/html
EXPOSE 80
