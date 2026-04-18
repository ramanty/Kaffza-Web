FROM node:20-alpine AS base
WORKDIR /app

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID
ARG NEXT_PUBLIC_APPLE_CLIENT_ID
ARG NEXT_PUBLIC_APPLE_REDIRECT_URI
ARG NEXT_PUBLIC_TURNSTILE_SITE_KEY

ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=${NEXT_PUBLIC_GOOGLE_CLIENT_ID}
ENV NEXT_PUBLIC_APPLE_CLIENT_ID=${NEXT_PUBLIC_APPLE_CLIENT_ID}
ENV NEXT_PUBLIC_APPLE_REDIRECT_URI=${NEXT_PUBLIC_APPLE_REDIRECT_URI}
ENV NEXT_PUBLIC_TURNSTILE_SITE_KEY=${NEXT_PUBLIC_TURNSTILE_SITE_KEY}

# Copy workspace manifests first so pnpm can resolve workspace packages
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/web/package.json ./apps/web/
COPY apps/api/package.json ./apps/api/
COPY apps/mobile/package.json ./apps/mobile/
COPY packages/types/package.json ./packages/types/
COPY packages/validators/package.json ./packages/validators/
COPY packages/tsconfig/package.json ./packages/tsconfig/

# Install all workspace dependencies with proper symlinks
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copy all source files (node_modules already built above)
COPY . .

RUN pnpm --filter=@kaffza/web build
EXPOSE 3000
CMD [ "pnpm", "--filter=@kaffza/web", "start" ]
