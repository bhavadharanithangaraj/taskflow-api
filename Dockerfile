# Production image for the API.
FROM node:24-alpine

WORKDIR /app
ENV NODE_ENV=production

# Install dependencies first (cached as long as package*.json don't change).
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY src ./src
COPY db ./db

# Don't run as root inside the container.
USER node

EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=5 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["node", "src/server.js"]
