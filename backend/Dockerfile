FROM node:20-alpine AS deps
WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./

# Install backend dependencies
RUN npm install

FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files and config files
COPY backend/package*.json ./
COPY backend/tsconfig*.json ./
COPY backend/nest-cli.json ./
COPY backend/typeorm.config.ts ./
COPY backend/typeorm.config.prod.ts ./

# Copy backend source files
COPY backend/src ./src

# Copy node_modules from deps
COPY --from=deps /app/node_modules ./node_modules

# Build backend
RUN npm run build

# Compile production typeorm config
RUN npx tsc typeorm.config.prod.ts --esModuleInterop --resolveJsonModule

FROM node:20-alpine AS runner
WORKDIR /app

# Copy backend dist and package files
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/typeorm.config.prod.js ./typeorm.config.js

# Install production dependencies only
RUN npm install --omit=dev

ENV NODE_ENV=production

ENTRYPOINT ["node", "dist/src/main.js"]
