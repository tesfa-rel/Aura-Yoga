FROM node:20-alpine AS builder
WORKDIR /app

COPY backend/package*.json backend/tsconfig.json ./backend/
COPY backend/prisma ./backend/prisma
COPY backend/src ./backend/src

RUN cd backend && npm ci && npx prisma generate && npm run build

FROM node:20-alpine AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodeuser

COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/node_modules ./node_modules
COPY --from=builder /app/backend/package.json ./package.json
COPY --from=builder /app/backend/prisma ./prisma

RUN mkdir -p uploads && chown nodeuser:nodejs uploads

USER nodeuser
EXPOSE 5000

ENV NODE_ENV=production
CMD ["node", "dist/index.js"]
