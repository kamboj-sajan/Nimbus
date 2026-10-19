# Per-user workspace image: the Nimbus runtime plus common language toolchains.
# Debian (not Alpine) so prebuilt node-pty binaries and most user tooling just work.

# ---------- Build ----------
FROM node:22-bookworm-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
COPY scripts ./scripts
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build && npm prune --omit=dev

# ---------- Run ----------
FROM node:22-bookworm-slim
ENV NODE_ENV=production \
    WORKSPACE_DIR=/workspace \
    RUNTIME_SHELL=bash \
    PORT=3000
RUN apt-get update && apt-get install -y --no-install-recommends \
      bash git curl ca-certificates procps less nano \
      python3 python3-pip python3-venv \
      build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /opt/nimbus
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./

# The base image's "node" user is uid 1000, matching the pod securityContext.
RUN mkdir -p /workspace && chown node:node /workspace
USER node
WORKDIR /workspace
EXPOSE 3000
CMD ["node", "/opt/nimbus/dist/index.js"]
