#!/bin/bash
# 🔒 Script de vérification d'intégrité du projet qcqbtmvbvipsxwjlgjvk
# Ce script s'assure que nous travaillons sur le bon projet Supabase

set -e

echo "🔍 VÉRIFICATION D'INTÉGRITÉ DU PROJET"
echo "========================================"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Vérifier que le fichier .env existe
if [ ! -f .env ]; then
    echo -e "${RED}❌ ERREUR: Fichier .env introuvable${NC}"
    exit 1
fi

# Extraire l'URL Supabase du .env
SUPABASE_URL=$(grep "^NEXT_PUBLIC_SUPABASE_URL=" .env | cut -d '=' -f2)

# Extraire le projet ID de l'URL
if [[ $SUPABASE_URL =~ https://([a-z0-9]+)\.supabase\.co ]]; then
    PROJECT_ID="${BASH_REMATCH[1]}"
else
    echo -e "${RED}❌ ERREUR: Impossible d'extraire le projet ID de l'URL${NC}"
    exit 1
fi

echo "📊 Projet détecté: $PROJECT_ID"

# Vérifier que c'est bien qcqbtmvbvipsxwjlgjvk
EXPECTED_PROJECT="qcqbtmvbvipsxwjlgjvk"

if [ "$PROJECT_ID" != "$EXPECTED_PROJECT" ]; then
    echo -e "${RED}❌ ERREUR CRITIQUE: Mauvais projet détecté!${NC}"
    echo -e "${RED}   Attendu: $EXPECTED_PROJECT${NC}"
    echo -e "${RED}   Trouvé:  $PROJECT_ID${NC}"
    echo ""
    echo -e "${YELLOW}🔄 RÉINITIALISATION REQUISE${NC}"
    echo "   Le .env doit pointer vers: https://$EXPECTED_PROJECT.supabase.co"
    exit 1
fi

# Vérifier l'ANON_KEY
ANON_KEY=$(grep "^NEXT_PUBLIC_SUPABASE_ANON_KEY=" .env | cut -d '=' -f2)
EXPECTED_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjcWJ0bXZidmlwc3h3amxnanZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MzIzNjAsImV4cCI6MjA4MjUwODM2MH0.q-4uGaHsuojj3ejo5IG4V-z2fx-ER9grHsRzYNkYn0c"

if [ "$ANON_KEY" != "$EXPECTED_ANON_KEY" ]; then
    echo -e "${YELLOW}⚠️  ATTENTION: ANON_KEY incorrecte détectée${NC}"
    echo "   La clé ANON doit être mise à jour"
    exit 1
fi

# Vérifier le SERVICE_ROLE_KEY
SERVICE_ROLE_KEY=$(grep "^SUPABASE_SERVICE_ROLE_KEY=" .env | cut -d '=' -f2)
EXPECTED_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjcWJ0bXZidmlwc3h3amxnanZrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjkzMjM2MCwiZXhwIjoyMDgyNTA4MzYwfQ.mFJHZV-VdueE_okBTqkVh18tRvee94a5Z-k5TM4FQxM"

if [ "$SERVICE_ROLE_KEY" != "$EXPECTED_SERVICE_KEY" ]; then
    echo -e "${YELLOW}⚠️  ATTENTION: SERVICE_ROLE_KEY incorrecte${NC}"
fi

echo ""
echo -e "${GREEN}✅ VÉRIFICATION RÉUSSIE${NC}"
echo -e "${GREEN}   Projet: $EXPECTED_PROJECT${NC}"
echo -e "${GREEN}   URL: https://$EXPECTED_PROJECT.supabase.co${NC}"
echo "========================================"

exit 0
