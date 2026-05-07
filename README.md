# Dockerizing a Next.js + Node.js Monorepo

A complete guide for containerizing a Next.js 16 + Node.js monorepo with CI/CD via GitHub Actions.

**Stack:** Next.js 16 | Node.js | TypeScript | Prisma | MongoDB Atlas | GitHub Actions | WSL Ubuntu

---

## Prerequisites

Ensure the following are installed on your Windows machine with WSL Ubuntu:

- Docker Desktop (Windows)
- WSL2 with Ubuntu installed
- Node.js v20+ and npm
- Git

---

## Project Structure

```
my-realestate-app/
├── frontend/          (Next.js 16)
│   ├── Dockerfile
│   └── .dockerignore
├── backend/           (Node.js + TypeScript + Prisma)
│   ├── Dockerfile
│   └── .dockerignore
└── docker-compose.yml
```

---

## Frontend Dockerfile

The frontend uses Next.js 16 with Turbopack enabled by default. Uses a multi-stage build for a lean production image.

> **💡 Add `output: 'standalone'` to `next.config.js` before building. This is required for the Docker runner stage.**

**next.config.js**

```js
module.exports = {
  output: 'standalone',
  turbopack: {},
  experimental: {
    serverComponentsExternalPackages: ['canvas', 'pdfjs-dist']
  },
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true }
}
```

**frontend/Dockerfile**

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache python3 make g++ cairo-dev jpeg-dev \
    pango-dev giflib-dev librsvg-dev pixman-dev freetype-dev
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache python3 make g++ cairo-dev jpeg-dev \
    pango-dev giflib-dev librsvg-dev pixman-dev freetype-dev
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache cairo jpeg pango giflib librsvg pixman freetype
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
```

---

## Backend Dockerfile

The backend uses Node.js with TypeScript, Prisma ORM, and MongoDB Atlas. Requires OpenSSL for Prisma and build tools for native packages like bcrypt.

**backend/Dockerfile**

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl python3 make g++
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
RUN npx prisma generate

FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl python3 make g++
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache openssl
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
EXPOSE 4001
CMD ["node", "dist/server.js"]
```

---

## .dockerignore Files

**frontend/.dockerignore**

```
node_modules
.next
.env
.env.local
*.log
.git
```

**backend/.dockerignore**

```
node_modules
dist
.env
*.log
.git
```

---

## docker-compose.yml

```yaml
services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    env_file:
      - ./frontend/.env.local
    environment:
      - NEXT_PUBLIC_API_URL=http://YOUR_IP:4001
      - NEXT_PUBLIC_SOCKET_URL=http://YOUR_IP:4001
      - BACKEND_URL=http://backend:4001
    depends_on:
      - backend
    networks:
      - app-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "4001:4001"
    env_file:
      - ./backend/.env
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

---

## Common Errors & Fixes

### 6.1 Docker Daemon Not Running
**Error:** `failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine`  
**Fix:** Open Docker Desktop from the Start menu and wait for 'Engine running' status before running `docker-compose`.

### 6.2 Turbopack + Webpack Config Conflict
**Error:** `This build is using Turbopack, with a webpack config and no turbopack config.`  
**Fix:** Replace `webpack: config` in `next.config.js` with `turbopack: {}`. Next.js 16 uses Turbopack by default.

### 6.3 Canvas Module Not Found
**Error:** `Module not found: Can't resolve 'canvas'`  
**Fix:** Install native canvas build dependencies in the Dockerfile using `apk add cairo-dev jpeg-dev pango-dev` etc. Also add `serverComponentsExternalPackages: ['canvas', 'pdfjs-dist']` to `next.config.js`.

### 6.4 Missing TypeScript Declaration File
**Error:** `TS7016 — Could not find a declaration file for module 'multer-storage-cloudinary'`  
**Fix:** Create `src/types/multer-storage-cloudinary.d.ts` with:
```ts
declare module 'multer-storage-cloudinary';
```

### 6.5 CloudinaryStorage Not a Constructor
**Error:** `TypeError: multer_storage_cloudinary_1.CloudinaryStorage is not a constructor`  
**Fix:** The package uses CommonJS exports. Change import to:
```ts
import CloudinaryStorage from 'multer-storage-cloudinary';
```

### 6.6 Wrong Entry Point
**Error:** `Cannot find module '/app/dist/index.js'`  
**Fix:** Update the CMD in backend Dockerfile:
```dockerfile
CMD ["node", "dist/server.js"]
```

### 6.7 Prisma OpenSSL Warning
**Error:** `Prisma failed to detect the libssl/openssl version to use`  
**Fix:** Add `openssl` and `libc6-compat` to `apk` installs in both deps and runner stages.

### 6.8 Docker Compose v1 vs v2 Incompatibility
**Error:** `KeyError: 'ContainerConfig'` on `docker-compose up`  
**Fix:** Install Docker Compose V2:
```bash
sudo apt install docker-compose-v2 -y
```
Then use `docker compose` (with a space) instead of `docker-compose`.

### 6.9 GitHub Push Blocked — Secret Detected
**Error:** `GH013 Push Protection — Google OAuth Client ID/Secret detected`  
**Fix:** Remove the file from git history:
```bash
git filter-repo --path <filename> --invert-paths --force
```
Then rotate your Google OAuth credentials immediately — they are compromised.

### 6.10 actions-runner Folder Committed
**Error:** `GH001 — File actions-runner/externals/node24/bin/node is 117.20 MB`  
**Fix:** Add `actions-runner/` to `.gitignore`, then remove from history with `git filter-repo` or a nuclear reset (`rm -rf .git`), then push again.

### 6.11 GitHub Authentication Failed
**Error:** `remote: Invalid username or token. Password authentication is not supported`  
**Fix:** GitHub no longer accepts passwords. Switch to SSH:
```bash
ssh-keygen -t ed25519
# Add public key to github.com/settings/keys
git remote set-url origin git@github.com:org/repo.git
```

### 6.12 Nested Git Repositories
**Error:** `warning: adding embedded git repository: backend / frontend`  
**Fix:**
```bash
rm -rf frontend/.git backend/.git
git rm --cached -f backend frontend
```

### 6.13 Email Privacy Block on Push
**Error:** `GH007 — Your push would publish a private email address`  
**Fix:** Get your no-reply email from `github.com/settings/emails` and set it:
```bash
git config --global user.email '123456+user@users.noreply.github.com'
git commit --amend --reset-author --no-edit
```

### 6.14 GitHub Actions Deploy SSH Failure
**Error:** `Process completed with exit code 1 — WSL IP 172.x.x.x not publicly accessible`  
**Fix:** Use a self-hosted GitHub Actions runner instead of SSH deploy. Run `./config.sh` and `./run.sh` from the `actions-runner` folder, then set `runs-on: self-hosted` in the deploy job.

---

## GitHub Actions CI/CD Workflow

```yaml
# .github/workflows/docker-publish.yml
name: Build and Push Docker Images

on:
  push:
    branches: [main]
  workflow_dispatch:

env:
  REGISTRY: ghcr.io
  OWNER: your-github-org

jobs:
  build-and-push-backend:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.CR_PAT }}
      - uses: docker/build-push-action@v5
        with:
          context: ./backend
          push: true
          tags: ghcr.io/${{ env.OWNER }}/backend:latest

  deploy:
    runs-on: self-hosted
    needs: [build-and-push-backend, build-and-push-frontend]
    steps:
      - name: Pull and restart
        run: |
          cd /home/your-user/myapp
          docker compose pull
          docker compose up -d
```

---

## Required GitHub Secrets

| Secret Name | Value |
|---|---|
| `CR_PAT` | GitHub Personal Access Token with `write:packages` scope |
| `SERVER_HOST` | Your server/WSL IP address |
| `SERVER_USER` | Your Ubuntu username (e.g. `droiddev`) |
| `SERVER_SSH_KEY` | Your private SSH key (`cat ~/.ssh/id_ed25519`) |
| `NEXT_PUBLIC_API_URL` | `http://YOUR_IP:4001` |
| `NEXT_PUBLIC_SOCKET_URL` | `http://YOUR_IP:4001` |

---

## Self-Hosted Runner Setup (WSL)

Since WSL does not have a public IP, use a self-hosted runner instead of SSH deployment:

1. Go to `github.com/your-repo/settings/actions/runners/new`
2. Select **Linux / x64**
3. Follow the setup commands GitHub provides
4. Run `./run.sh` to start listening for jobs

To keep the runner running permanently as a service:

```bash
cd ~/myapp/actions-runner
sudo ./svc.sh install
sudo ./svc.sh start
```

> **💡 Add `actions-runner/` to your `.gitignore`** — it contains large binary files that will exceed GitHub's 100MB file size limit.

---

## Daily Commands Reference

| Command | What it does |
|---|---|
| `docker compose up --build` | Build and start all containers |
| `docker compose up -d` | Run in background (detached) |
| `docker compose down` | Stop all containers |
| `docker compose logs -f backend` | View backend logs live |
| `docker compose pull` | Pull latest images from registry |
| `docker ps` | List running containers |
| `docker images` | List all built images |
| `git push origin main` | Trigger full CI/CD pipeline |

---

## Pipeline Flow

```
git push origin main
  → GitHub Actions builds images
  → Push to ghcr.io
  → Self-hosted runner pulls & restarts
  → App live at localhost:3000
```

