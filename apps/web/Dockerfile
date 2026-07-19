FROM node:lts-alpine3.20  AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# ARG NEXT_PUBLIC_API_URL


# ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}


RUN npm run build

FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production

# ARG NEXT_PUBLIC_API_URL


# ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}


RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

COPY --from=builder /app/public ./public

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3001

ENV PORT 3001

ENV HOST 0.0.0.0
CMD ["node", "server.js"]
