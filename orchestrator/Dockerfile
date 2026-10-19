# ---------- Build ----------
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---------- Run ----------
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production \
    ORCHESTRATOR_MODE=kubernetes
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
# dist/ includes the Deployment / Service templates copied by the build script.
COPY --from=build /app/dist ./dist
USER node
EXPOSE 3002
CMD ["node", "dist/index.js"]
