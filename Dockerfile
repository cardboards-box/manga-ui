ARG NODE_VERSION=oven/bun:latest

FROM $NODE_VERSION AS build
WORKDIR /app

COPY src/package.json .
COPY src/bun.lock .
RUN bun install --frozen-lockfile

COPY src/ .

RUN bun build --frozen-lockfile --production

FROM $NODE_VERSION AS production

COPY --from=build /app/.output /app/.output
ENV NUXT_HOST=0.0.0.0
ENV NUXT_PORT=3000
ENV NODE_ENV=production

EXPOSE 3000
CMD ["bun", "run", "/app/.output/server/index.mjs"]
