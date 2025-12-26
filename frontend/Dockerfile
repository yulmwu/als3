FROM node:alpine AS deps
WORKDIR /app

COPY frontend/package.json ./frontend/

WORKDIR /app/frontend
RUN npm install

FROM node:alpine AS builder
WORKDIR /app

COPY frontend ./frontend
COPY --from=deps /app/frontend/node_modules ./frontend/node_modules

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
