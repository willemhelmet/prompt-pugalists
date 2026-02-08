FROM node:20-slim

# better-sqlite3 needs build tools for its native C++ addon
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ── 1. Install client dependencies & build ──
COPY client/package.json client/package-lock.json ./client/
RUN cd client && npm ci

COPY client/ ./client/
RUN cd client && npm run build

# ── 2. Install server dependencies & build ──
COPY server/package.json server/package-lock.json ./server/
RUN cd server && npm ci

COPY server/ ./server/
RUN cd server && npm run build

# ── 3. Move client build output into server's static dir ──
RUN mv client/dist server/public

# ── 4. Run ──
WORKDIR /app/server
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
CMD ["node", "dist/index.js"]
