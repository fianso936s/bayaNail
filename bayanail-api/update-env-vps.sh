#!/bin/bash
# Script pour mettre à jour le .env sur le VPS
# Usage: bash update-env-vps.sh API_PATH

API_PATH="$1"

if [ -z "$API_PATH" ]; then
    echo "❌ Usage: bash update-env-vps.sh /chemin/vers/bayanail-api"
    exit 1
fi

cd "$API_PATH" || exit 1

# Creer .env s'il n'existe pas
if [ ! -f .env ]; then
    echo "Creation du fichier .env..."
    touch .env
fi

# Sauvegarder
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)

# Variables à mettre à jour (seront remplacées par le script PowerShell)
NODE_ENV="production"
FRONTEND_URL="https://bayanail.com"
DATABASE_URL="postgresql://neondb_owner:npg_UiGw9m0hqsvS@ep-muddy-cell-ahzxxj69-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
JWT_SECRET="f08067b81db8ea38c7da688b7d395d73c30bfe3f5e8bc5327f5ff4514e86f91d"
JWT_REFRESH_SECRET="3ec65f61dd7764a3bb1bacc3050217754fcca9a3e75ae89a1f4541af125376bb"

# Mettre à jour les variables (supprimer d'abord les anciennes lignes, puis ajouter)
# NODE_ENV
sed -i '/^NODE_ENV=/d' .env 2>/dev/null
echo "NODE_ENV=$NODE_ENV" >> .env

# FRONTEND_URL
sed -i '/^FRONTEND_URL=/d' .env 2>/dev/null
echo "FRONTEND_URL=\"$FRONTEND_URL\"" >> .env

# DATABASE_URL (supprimer toutes les lignes DATABASE_URL pour éviter les doublons)
sed -i '/^DATABASE_URL=/d' .env 2>/dev/null
echo "DATABASE_URL=\"$DATABASE_URL\"" >> .env

# JWT_SECRET
sed -i '/^JWT_SECRET=/d' .env 2>/dev/null
echo "JWT_SECRET=\"$JWT_SECRET\"" >> .env

# JWT_REFRESH_SECRET
sed -i '/^JWT_REFRESH_SECRET=/d' .env 2>/dev/null
echo "JWT_REFRESH_SECRET=\"$JWT_REFRESH_SECRET\"" >> .env

# Vérifier
echo "✅ Variables mises à jour:"
grep -E "^(NODE_ENV|DATABASE_URL|JWT_SECRET|JWT_REFRESH_SECRET|FRONTEND_URL|PORT)=" .env | head -6

