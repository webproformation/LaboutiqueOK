#!/bin/bash

echo "🔍 VÉRIFICATION STRICTE DU PROJET qcqbtmv"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m'

ERROR=0
WARNING=0

echo "1️⃣  Vérification de lib/supabase.ts (CRITIQUE)"
echo "   → Ce fichier DOIT utiliser les credentials hardcodés"
echo ""

if grep -q "LOCKED_SUPABASE_URL = 'https://qcqbtmvbvipsxwjlgjvk.supabase.co'" lib/supabase.ts; then
    echo -e "   ${GREEN}✓${NC} URL hardcodée correcte : qcqbtmvbvipsxwjlgjvk"
else
    echo -e "   ${RED}✗ ERREUR CRITIQUE${NC} : lib/supabase.ts n'a PAS l'URL hardcodée correcte"
    ERROR=1
fi

if grep -q "const supabaseUrl = LOCKED_SUPABASE_URL" lib/supabase.ts; then
    echo -e "   ${GREEN}✓${NC} Utilise bien les credentials hardcodés"
else
    echo -e "   ${RED}✗ ERREUR CRITIQUE${NC} : lib/supabase.ts utilise process.env"
    ERROR=1
fi

echo ""
echo "2️⃣  Vérification de .env (SECONDAIRE)"
echo "   → Ce fichier devrait être correct mais n'est PAS utilisé par le code"
echo ""

if grep -q "qcqbtmvbvipsxwjlgjvk" .env; then
    echo -e "   ${GREEN}✓${NC} .env contient qcqbtmvbvipsxwjlgjvk"
else
    echo -e "   ${YELLOW}⚠${NC}  ATTENTION : .env ne contient PAS qcqbtmvbvipsxwjlgjvk"
    echo "   ${YELLOW}→${NC} Mais ce n'est pas critique car lib/supabase.ts utilise le hardcoding"
    WARNING=1
fi

if grep -q "mcstvpdcfvhsgnhdfeee" .env; then
    echo -e "   ${YELLOW}⚠${NC}  ATTENTION : .env contient mcstv (projet interdit)"
    echo "   ${YELLOW}→${NC} Mais ce n'est pas critique car lib/supabase.ts utilise le hardcoding"
    WARNING=1
fi

echo ""
echo "3️⃣  Vérification de .env.lock (RÉFÉRENCE)"
echo ""

if [ -f ".env.lock" ]; then
    if grep -q "qcqbtmvbvipsxwjlgjvk" .env.lock; then
        echo -e "   ${GREEN}✓${NC} .env.lock existe et contient la référence correcte"
    else
        echo -e "   ${RED}✗${NC} .env.lock ne contient PAS qcqbtmvbvipsxwjlgjvk"
        ERROR=1
    fi
else
    echo -e "   ${YELLOW}⚠${NC}  .env.lock n'existe pas"
    WARNING=1
fi

echo ""
echo "4️⃣  Vérification de .bolt/PROJECT-LOCK.json"
echo ""

if [ -f ".bolt/PROJECT-LOCK.json" ]; then
    if grep -q "qcqbtmvbvipsxwjlgjvk" .bolt/PROJECT-LOCK.json; then
        echo -e "   ${GREEN}✓${NC} PROJECT-LOCK.json existe et est correct"
    else
        echo -e "   ${RED}✗${NC} PROJECT-LOCK.json ne contient PAS qcqbtmvbvipsxwjlgjvk"
        ERROR=1
    fi
else
    echo -e "   ${YELLOW}⚠${NC}  .bolt/PROJECT-LOCK.json n'existe pas"
    WARNING=1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $ERROR -eq 0 ] && [ $WARNING -eq 0 ]; then
    echo -e "${GREEN}${BOLD}✓ SUCCÈS TOTAL${NC}"
    echo "Le projet est PARFAITEMENT configuré sur qcqbtmvbvipsxwjlgjvk"
    exit 0
elif [ $ERROR -eq 0 ]; then
    echo -e "${YELLOW}${BOLD}⚠ SUCCÈS AVEC AVERTISSEMENTS${NC}"
    echo "Le projet fonctionne mais quelques fichiers devraient être corrigés"
    echo ""
    echo "💡 Pour restaurer .env, exécuter :"
    echo "   cp .env.lock .env"
    exit 0
else
    echo -e "${RED}${BOLD}✗ ÉCHEC CRITIQUE${NC}"
    echo "Des erreurs CRITIQUES ont été détectées dans lib/supabase.ts"
    echo "L'application pourrait ne PAS fonctionner correctement"
    exit 1
fi
