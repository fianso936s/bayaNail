#!/bin/bash
# Chercher le dossier bayanail-api
# D'abord essayer les chemins avec sous-dossier
for dir in /srv/bayanail-api/bayanail-api /root/bayanail-api/bayanail-api /opt/bayanail-api/bayanail-api; do
    if [ -d "$dir" ] && [ -f "$dir/package.json" ]; then
        echo "$dir"
        exit 0
    fi
done

# Ensuite essayer les chemins simples
for dir in /root/bayanail-api ~/bayanail-api /opt/bayanail-api /var/www/bayanail-api /usr/local/bayanail-api /srv/bayanail-api; do
    if [ -d "$dir" ] && [ -f "$dir/package.json" ]; then
        echo "$dir"
        exit 0
    fi
done

# Si pas trouvé, chercher par package.json et prendre le plus spécifique
FOUND=$(find / -name "package.json" -path "*/bayanail-api/bayanail-api/*" 2>/dev/null | head -1)
if [ -n "$FOUND" ]; then
    dirname "$FOUND"
    exit 0
fi

FOUND=$(find / -name "package.json" -path "*/bayanail-api/*" 2>/dev/null | head -1)
if [ -n "$FOUND" ]; then
    dirname "$FOUND"
    exit 0
fi

# Dernier recours: chercher par .env
FOUND=$(find / -name ".env" -path "*/bayanail-api/bayanail-api/*" 2>/dev/null | head -1)
if [ -n "$FOUND" ]; then
    dirname "$FOUND"
    exit 0
fi

FOUND=$(find / -name ".env" -path "*/bayanail-api/*" 2>/dev/null | head -1)
if [ -n "$FOUND" ]; then
    dirname "$FOUND"
    exit 0
fi

exit 1

