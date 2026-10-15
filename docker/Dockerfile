FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=6380
ENV HTTP_PORT=6381

COPY package.json ./
COPY server/ ./server/
COPY bin/ ./bin/
COPY sdks/typescript/dist/ ./sdks/typescript/dist/

RUN chmod +x bin/nexora-server.js bin/nexora.js

EXPOSE 6380 6381

VOLUME ["/data"]

ENTRYPOINT ["node", "bin/nexora-server.js"]
CMD ["--bind", "0.0.0.0", "--port", "6380", "--http-port", "6381", "--data-dir", "/data"]
