#!/bin/bash
# Script simple pour trouver le chemin et déployer
# Usage: bash deploy-vps-simple.sh

echo "🔍 Recherche du chemin sur le VPS..."

# Chercher le dossier
API_PATH=$(ssh root@62.72.18.224 'find / -name "package.json" -path "*/bayanail-api/*" 2>/dev/null | head -1 | xargs dirname')

if [ -z "$API_PATH" ]; then
    echo "❌ Chemin non trouvé"
    echo ""
    echo "💡 Connectez-vous manuellement:"
    echo "   ssh root@62.72.18.224"
    echo "   find / -name 'package.json' -path '*/bayanail-api/*' 2>/dev/null"
    exit 1
fi

echo "✅ Chemin trouvé: $API_PATH"
echo ""

# Build local
echo "📦 Build local..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Erreur lors du build"
    exit 1
fi

# Copier
echo "📤 Copie vers $API_PATH..."
scp -r dist root@62.72.18.224:"$API_PATH/"

if [ $? -eq 0 ]; then
    echo "✅ Copie réussie"
    echo ""
    echo "🔄 Redémarrage..."
    ssh root@62.72.18.224 "cd $API_PATH && pm2 restart bayanail-api"
    echo "✅ Déploiement terminé"
else
    echo "❌ Erreur lors de la copie"
    exit 1
fi

