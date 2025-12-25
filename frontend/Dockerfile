FROM node:alpine AS deps
WORKDIR /app

COPY shared/package.json ./shared/
COPY shared/tsconfig.json ./shared/
COPY shared/src ./shared/src

COPY frontend/package.json ./frontend/

WORKDIR /app/shared
RUN npm install

WORKDIR /app/frontend
RUN npm install

FROM node:alpine AS builder
WORKDIR /app

COPY shared ./shared
COPY --from=deps /app/shared/node_modules ./shared/node_modules

COPY frontend ./frontend
COPY --from=deps /app/frontend/node_modules ./frontend/node_modules

WORKDIR /app/shared
RUN npm run build

WORKDIR /app/frontend
RUN npm run build
RUN npm install --omit=dev

FROM node:alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/frontend/.next/standalone ./
COPY --from=builder /app/frontend/.next/static ./.next/static
COPY --from=builder /app/frontend/public ./public

# Copy entrypoint script
COPY frontend/docker-entrypoint.sh /app/
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 4000

ENTRYPOINT ["/app/docker-entrypoint.sh"]
