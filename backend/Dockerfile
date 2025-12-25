FROM node:20-alpine AS deps
WORKDIR /app

# Copy shared package
COPY shared/package.json ./shared/package.json
COPY shared/tsconfig.json ./shared/tsconfig.json
COPY shared/src ./shared/src

# Build shared
WORKDIR /app/shared
RUN npm install && npm run build

# Copy backend package.json
WORKDIR /app
COPY backend/package*.json ./backend/

# Install backend dependencies
WORKDIR /app/backend
RUN npm install

FROM node:20-alpine AS builder
WORKDIR /app

# Copy shared (built)
COPY --from=deps /app/shared ./shared

# Copy backend package files and config files
COPY backend/package*.json ./backend/
COPY backend/tsconfig*.json ./backend/
COPY backend/nest-cli.json ./backend/
COPY backend/typeorm.config.ts ./backend/

# Copy backend source files
COPY backend/src ./backend/src

# Then copy node_modules
COPY --from=deps /app/backend/node_modules ./backend/node_modules

# Build backend
WORKDIR /app/backend
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

# Copy shared with node_modules
COPY --from=builder /app/shared/package.json ./shared/package.json
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=deps /app/shared/node_modules ./shared/node_modules

# Copy backend dist and package files
COPY --from=builder /app/backend/package*.json ./backend/
COPY --from=builder /app/backend/dist ./backend/dist

# Install production dependencies
WORKDIR /app/backend
RUN npm install --omit=dev

ENV NODE_ENV=production

ENTRYPOINT ["node", "dist/src/main.js"]
