#!/bin/bash

# Script de test CSRF manuel avec curl
# Usage: ./test-security-csrf.sh [API_URL]

API_URL=${1:-"http://localhost:3001"}

echo "=========================================="
echo "🔒 TESTS CSRF - MONITEUR1D API"
echo "=========================================="
echo "API URL: $API_URL"
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

passed=0
failed=0

# Test 1: Requête sans token CSRF
echo -e "${BLUE}Test 1: Requête POST sans token CSRF${NC}"
response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/contact" \
    -H "Content-Type: application/json" \
    -d '{
        "firstName": "Test",
        "lastName": "User",
        "email": "test@example.com",
        "phone": "0612345678",
        "message": "Test message without CSRF token"
    }')

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "403" ]; then
    echo -e "${GREEN}✅ BLOQUÉ (HTTP $http_code) - Protection CSRF active${NC}"
    echo "   Réponse: $(echo $body | jq -r '.message // .error // "OK"' 2>/dev/null || echo $body)"
    ((passed++))
else
    echo -e "${RED}❌ ACCEPTÉ (HTTP $http_code) - VULNÉRABILITÉ CSRF!${NC}"
    echo "   Réponse: $body"
    ((failed++))
fi
echo ""

# Test 2: Récupérer un token CSRF
echo -e "${BLUE}Test 2: Récupération du token CSRF${NC}"
csrf_response=$(curl -s -c /tmp/cookies.txt "$API_URL/auth/csrf-token")
csrf_token=$(echo "$csrf_response" | jq -r '.csrfToken // empty' 2>/dev/null)

if [ -z "$csrf_token" ]; then
    # Essayer de récupérer depuis le cookie
    csrf_token=$(grep "csrf-token" /tmp/cookies.txt | awk '{print $7}' | head -1)
fi

if [ -n "$csrf_token" ]; then
    echo -e "${GREEN}✅ Token CSRF récupéré: ${csrf_token:0:20}...${NC}"
    ((passed++))
else
    echo -e "${RED}❌ Impossible de récupérer le token CSRF${NC}"
    echo "   Réponse: $csrf_response"
    ((failed++))
fi
echo ""

# Test 3: Requête avec token CSRF valide
if [ -n "$csrf_token" ]; then
    echo -e "${BLUE}Test 3: Requête POST avec token CSRF valide${NC}"
    response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/contact" \
        -H "Content-Type: application/json" \
        -H "X-CSRF-Token: $csrf_token" \
        -b /tmp/cookies.txt \
        -d "{
            \"firstName\": \"Test\",
            \"lastName\": \"User\",
            \"email\": \"test@example.com\",
            \"phone\": \"0612345678\",
            \"message\": \"Test message with valid CSRF token\",
            \"csrfToken\": \"$csrf_token\"
        }")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "201" ] || [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✅ ACCEPTÉ (HTTP $http_code) - Token CSRF valide${NC}"
        ((passed++))
    elif [ "$http_code" = "403" ]; then
        echo -e "${RED}❌ REJETÉ (HTTP $http_code) - Token invalide?${NC}"
        echo "   Réponse: $body"
        ((failed++))
    else
        echo -e "${YELLOW}⚠️  Status inattendu: HTTP $http_code${NC}"
        echo "   Réponse: $body"
    fi
    echo ""
fi

# Test 4: Requête avec token CSRF invalide
echo -e "${BLUE}Test 4: Requête POST avec token CSRF invalide${NC}"
response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/contact" \
    -H "Content-Type: application/json" \
    -H "X-CSRF-Token: invalid-token-12345" \
    -d '{
        "firstName": "Test",
        "lastName": "User",
        "email": "test@example.com",
        "phone": "0612345678",
        "message": "Test message with invalid CSRF token",
        "csrfToken": "invalid-token-12345"
    }')

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "403" ]; then
    echo -e "${GREEN}✅ BLOQUÉ (HTTP $http_code) - Token invalide rejeté${NC}"
    echo "   Réponse: $(echo $body | jq -r '.message // .error // "OK"' 2>/dev/null || echo $body)"
    ((passed++))
else
    echo -e "${RED}❌ ACCEPTÉ (HTTP $http_code) - VULNÉRABILITÉ CSRF!${NC}"
    echo "   Réponse: $body"
    ((failed++))
fi
echo ""

# Nettoyer
rm -f /tmp/cookies.txt

# Résumé
echo "=========================================="
echo "📊 RÉSUMÉ"
echo "=========================================="
echo -e "${GREEN}✅ Réussis: $passed${NC}"
echo -e "${RED}❌ Échoués: $failed${NC}"
echo ""

if [ $failed -eq 0 ]; then
    echo -e "${GREEN}🎉 Tous les tests CSRF sont passés!${NC}"
    exit 0
else
    echo -e "${RED}⚠️  Certains tests ont échoué!${NC}"
    exit 1
fi

