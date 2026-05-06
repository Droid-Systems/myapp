# ---- Stage 1: Install dependencies ----
    FROM node:20-alpine AS deps
    WORKDIR /app
    
    # Install dependencies needed for Prisma and OpenSSL 3.0
    RUN apk add --no-cache libc6-compat openssl
    
    COPY package*.json ./
    COPY prisma ./prisma/ 
    
    RUN npm ci
    # Generate the Prisma client for the container's OS (linux-musl)
    RUN npx prisma generate
    
    # ---- Stage 2: Build ----
    FROM node:20-alpine AS builder
    WORKDIR /app
    COPY --from=deps /app/node_modules ./node_modules
    COPY . .
    RUN npm run build
    
    # ---- Stage 3: Run ----
    FROM node:20-alpine AS runner
    WORKDIR /app
    ENV NODE_ENV=production
    
    # Re-install openssl in the final stage so the runtime has it
    RUN apk add --no-cache openssl
    
    COPY --from=builder /app/dist ./dist
    COPY --from=builder /app/node_modules ./node_modules
    COPY --from=builder /app/package.json ./package.json
    
    EXPOSE 4001
    CMD ["node", "dist/server.js"]
    