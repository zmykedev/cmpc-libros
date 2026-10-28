FROM node:22-alpine AS build
RUN apk add --no-cache openssl
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate \
 && npm run build \
 && npx tsc prisma/seed.ts --outDir dist-seed --esModuleInterop --skipLibCheck \
 && npm prune --omit=dev

FROM node:22-alpine
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/dist-seed ./dist-seed
COPY --from=build /app/prisma ./prisma
COPY package.json ./
RUN mkdir -p uploads && chown -R node:node /app
USER node
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist-seed/seed.js && node dist/main.js"]
