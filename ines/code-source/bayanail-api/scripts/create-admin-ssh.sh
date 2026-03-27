#!/bin/bash

# Script pour créer/mettre à jour l'admin via SSH
# Usage: ./create-admin-ssh.sh [email] [password] [firstName] [lastName]

set -e  # Arrêter en cas d'erreur

echo "🔐 Création/Mise à jour du compte administrateur"
echo "============================================================"
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Variables d'environnement (peuvent être surchargées)
ADMIN_EMAIL="${1:-${ADMIN_EMAIL:-admin@bayanail.com}}"
ADMIN_PASSWORD="${2:-${ADMIN_PASSWORD:-lounes92}}"
ADMIN_FIRST_NAME="${3:-${ADMIN_FIRST_NAME:-Admin}}"
ADMIN_LAST_NAME="${4:-${ADMIN_LAST_NAME:-System}}"

# Afficher les informations (sans le mot de passe complet)
echo "📧 Email: $ADMIN_EMAIL"
echo "👤 Nom: $ADMIN_FIRST_NAME $ADMIN_LAST_NAME"
echo "🔒 Mot de passe: ***${ADMIN_PASSWORD: -3} (${#ADMIN_PASSWORD} caractères)"
echo ""

# Vérifier que Node.js est installé
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js n'est pas installé${NC}"
    exit 1
fi

# Vérifier que npm est installé
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm n'est pas installé${NC}"
    exit 1
fi

# Vérifier que le fichier .env existe
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  Fichier .env non trouvé${NC}"
    echo "   Créez un fichier .env avec DATABASE_URL configuré"
    exit 1
fi

# Exporter les variables d'environnement
export ADMIN_EMAIL
export ADMIN_PASSWORD
export ADMIN_FIRST_NAME
export ADMIN_LAST_NAME

# Exécuter le script TypeScript
echo "🚀 Exécution du script de création..."
echo ""

if command -v tsx &> /dev/null; then
    tsx scripts/create-admin-ssh.ts
elif command -v ts-node &> /dev/null; then
    ts-node scripts/create-admin-ssh.ts
else
    # Compiler et exécuter
    echo "📦 Compilation TypeScript..."
    npm run build
    node dist/scripts/create-admin-ssh.js
fi

echo ""
echo -e "${GREEN}✅ Script terminé${NC}"

