FROM node:20-alpine AS base
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter=@kaffza/api build
EXPOSE 3000
CMD [ "pnpm", "run", "start", "--filter=@kaffza/api" ]