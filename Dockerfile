ARG NODE_VERSION=node:18

FROM $NODE_VERSION AS build
WORKDIR /app

COPY src/package.json .
COPY src/yarn.lock .
RUN yarn install

COPY src/ .

RUN yarn build

FROM $NODE_VERSION-slim AS production

COPY --from=build /app/.output /app/.output
ENV NUXT_HOST=0.0.0.0
ENV NUXT_PORT=3000
ENV NODE_ENV=production

EXPOSE 3000
CMD ["node", "/app/.output/server/index.mjs"]