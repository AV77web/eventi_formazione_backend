# syntax=docker/dockerfile:1

# Versione di Node da usare
ARG NODE_VERSION=22.14.0

# Base image
FROM node:${NODE_VERSION}-slim AS base

LABEL fly_launch_runtime="Node.js"

# Working directory
WORKDIR /app

# =========================
# STAGE 1: build
# =========================
FROM base AS build

# Dipendenze per compilare i moduli native (se servono)
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential node-gyp pkg-config python-is-python3 && \
    rm -rf /var/lib/apt/lists/*

# Installa dipendenze
COPY package*.json ./
RUN npm ci

# Copia il codice applicativo
COPY . .

# Se hai uno step di build (React, Next, ecc.), lascialo:
# altrimenti puoi commentare la riga sotto
RUN npm run build || echo "Nessuno step di build, continuo..."

# =========================
# STAGE 2: runtime
# =========================
FROM node:${NODE_VERSION}-slim AS runtime

WORKDIR /app

# Ambiente produzione
ENV NODE_ENV=production

# Copia SOLO ciò che serve a runtime
COPY --from=build /app /app

# Espone la porta (adatta se serve diversa)
EXPOSE 3000

# Comando di avvio (adatta se usi un altro script)
CMD [ "npm", "run", "start" ]