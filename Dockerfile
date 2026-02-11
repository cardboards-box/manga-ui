# Stage 1: Build the application
FROM oven/bun:1 AS build
WORKDIR /app
COPY src/package.json src/bun.lock* ./
RUN bun install --frozen-lockfile --ignore-scripts
COPY src/ .
RUN bun --bun run build

# Stage 2: Run the built application
FROM oven/bun:1-slim AS production
WORKDIR /app
COPY --from=build /app/.output /app
EXPOSE 3000
ENV HOST=0.0.0.0
ENV PORT=3000
ENV NODE_ENV="production"
ENTRYPOINT [ "bun", "--bun", "run", "/app/server/index.mjs" ]
