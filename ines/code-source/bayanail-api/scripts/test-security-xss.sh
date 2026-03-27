#!/bin/bash

# Script de test XSS manuel avec curl
# Usage: ./test-security-xss.sh [API_URL]

API_URL=${1:-"http://localhost:3001"}

echo "=========================================="
echo "🧪 TESTS XSS - MONITEUR1D API"
echo "=========================================="
echo "API URL: $API_URL"
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Payloads XSS à tester
declare -a payloads=(
    "<script>alert('XSS')</script>"
    "<img src=x onerror=alert('XSS')>"
    "<svg onload=alert('XSS')>"
    "javascript:alert('XSS')"
    "<iframe src='javascript:alert(\"XSS\")'></iframe>"
    "<body onload=alert('XSS')>"
    "<input onfocus=alert('XSS') autofocus>"
    "<details open ontoggle=alert('XSS')>"
)

# Fonction pour tester un payload
test_xss_payload() {
    local payload=$1
    local field=$2
    
    echo -e "${YELLOW}Test: $field = ${payload:0:30}...${NC}"
    
    response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/contact" \
        -H "Content-Type: application/json" \
        -d "{
            \"firstName\": \"$payload\",
            \"lastName\": \"Test\",
            \"email\": \"test@example.com\",
            \"phone\": \"0612345678\",
            \"message\": \"Test message\"
        }")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "400" ] || [ "$http_code" = "403" ]; then
        echo -e "${GREEN}✅ BLOQUÉ (HTTP $http_code)${NC}"
        echo "   Réponse: $(echo $body | jq -r '.message // .error // "OK"' 2>/dev/null || echo $body)"
        return 0
    else
        echo -e "${RED}❌ ACCEPTÉ (HTTP $http_code) - VULNÉRABILITÉ!${NC}"
        echo "   Réponse: $body"
        return 1
    fi
}

# Tests
passed=0
failed=0

for payload in "${payloads[@]}"; do
    if test_xss_payload "$payload" "firstName"; then
        ((passed++))
    else
        ((failed++))
    fi
    echo ""
done

# Résumé
echo "=========================================="
echo "📊 RÉSUMÉ"
echo "=========================================="
echo -e "${GREEN}✅ Réussis: $passed${NC}"
echo -e "${RED}❌ Échoués: $failed${NC}"
echo ""

if [ $failed -eq 0 ]; then
    echo -e "${GREEN}🎉 Tous les tests XSS sont passés!${NC}"
    exit 0
else
    echo -e "${RED}⚠️  Certains tests ont échoué!${NC}"
    exit 1
fi

