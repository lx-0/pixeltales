# Build stage
FROM node:18-alpine AS base
WORKDIR /app

# Development stage
FROM base AS development
COPY package*.json ./
RUN npm ci
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]

# Production build stage
FROM base AS production
COPY package*.json ./
# Clear npm cache and ensure clean install
RUN npm cache clean --force && \
    npm ci
COPY . .
# Debug: List files to verify structure
RUN echo "Checking file structure:" && \
    ls -la
RUN echo "Checking src:" && \
    ls -la src
RUN echo "Checking src/lib:" && \
    ls -la src/lib
RUN echo "Node version:" && \
    node --version
RUN echo "NPM version:" && \
    npm --version
# First run TypeScript check separately to see errors clearly
RUN npm run typecheck || true
# Then run the build (which includes another TypeScript check)
RUN npm run build

# Production runtime stage
FROM nginx:alpine AS production-runtime
COPY --from=production /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]