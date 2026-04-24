# Base stage with pnpm via corepack
FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /app

# Development stage
FROM base AS development
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
EXPOSE 5173
CMD ["pnpm", "dev", "--host"]

# Production build stage
FROM base AS production
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run typecheck
RUN pnpm run build

# Production runtime stage
FROM nginx:alpine AS production-runtime
COPY --from=production /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
