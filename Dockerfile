FROM oven/bun:1 AS base
WORKDIR /app

FROM base AS install
COPY . .
RUN bun install
RUN bun build --compile --minify --sourcemap --target=bun-linux-x64 ./src/index.ts --outfile logkraken

FROM oven/bun:distroless AS release
WORKDIR /app
COPY --from=install /app/logkraken /app/logkraken
RUN mkdir logs

EXPOSE 3333/tcp
ENTRYPOINT ["./logkraken"]
