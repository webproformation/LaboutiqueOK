#!/bin/bash

echo "🔍 VÉRIFICATION DU PROJET..."
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERROR=0

# Vérification 1 : .env contient qcqbtmv
echo "📄 Vérification du fichier .env..."
if grep -q "qcqbtmvbvipsxwjlgjvk" .env; then
    echo -e "${GREEN}✓${NC} .env contient qcqbtmvbvipsxwjlgjvk"
else
    echo -e "${RED}✗${NC} ERREUR : .env ne contient PAS qcqbtmvbvipsxwjlgjvk"
    ERROR=1
fi

if grep -q "mcstvpdcfvhsgnhdfeee" .env; then
    echo -e "${RED}✗${NC} ERREUR CRITIQUE : .env contient mcstv (projet interdit)"
    ERROR=1
fi

echo ""

# Vérification 2 : lib/supabase.ts est hardcodé
echo "📄 Vérification du fichier lib/supabase.ts..."
if grep -q "LOCKED_SUPABASE_URL = 'https://qcqbtmvbvipsxwjlgjvk.supabase.co'" lib/supabase.ts; then
    echo -e "${GREEN}✓${NC} lib/supabase.ts contient les credentials hardcodés corrects"
else
    echo -e "${RED}✗${NC} ERREUR : lib/supabase.ts ne contient PAS les credentials hardcodés"
    ERROR=1
fi

if grep -q "process.env.NEXT_PUBLIC_SUPABASE" lib/supabase.ts; then
    echo -e "${YELLOW}⚠${NC}  ATTENTION : lib/supabase.ts utilise process.env (risque de revert)"
fi

echo ""

# Vérification 3 : PROJECT-LOCK.json existe
echo "📄 Vérification du fichier .bolt/PROJECT-LOCK.json..."
if [ -f ".bolt/PROJECT-LOCK.json" ]; then
    if grep -q "qcqbtmvbvipsxwjlgjvk" .bolt/PROJECT-LOCK.json; then
        echo -e "${GREEN}✓${NC} PROJECT-LOCK.json existe et contient qcqbtmvbvipsxwjlgjvk"
    else
        echo -e "${RED}✗${NC} ERREUR : PROJECT-LOCK.json ne contient PAS qcqbtmvbvipsxwjlgjvk"
        ERROR=1
    fi
else
    echo -e "${YELLOW}⚠${NC}  ATTENTION : .bolt/PROJECT-LOCK.json n'existe pas"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $ERROR -eq 0 ]; then
    echo -e "${GREEN}✓ SUCCÈS${NC} : Le projet est correctement configuré sur qcqbtmvbvipsxwjlgjvk"
    exit 0
else
    echo -e "${RED}✗ ÉCHEC${NC} : Des erreurs ont été détectées. Vérifiez la configuration."
    exit 1
fi
