#!/bin/bash

# Script de vérification du verrouillage sur qcqbtmv
# Exécutez ce script pour vérifier que le projet est bien connecté à qcqbtmv

echo "=========================================="
echo "VÉRIFICATION VERROUILLAGE qcqbtmv"
echo "=========================================="
echo ""

ERRORS=0

# 1. Vérifier le .env
echo "1. Vérification du .env..."
if grep -q "qcqbtmvbvipsxwjlgjvk.supabase.co" .env; then
    echo "   ✅ .env contient qcqbtmv"
else
    echo "   ❌ ERREUR: .env ne contient PAS qcqbtmv"
    ERRORS=$((ERRORS + 1))
fi

if grep -q "mcstvpdcfvhsgnhdfeee" .env; then
    echo "   ❌ ERREUR: .env contient mcstv (À CORRIGER)"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# 2. Vérifier lib/supabase.ts
echo "2. Vérification de lib/supabase.ts..."
if grep -q "qcqbtmvbvipsxwjlgjvk.supabase.co" lib/supabase.ts; then
    echo "   ✅ lib/supabase.ts hardcodé sur qcqbtmv"
else
    echo "   ❌ ERREUR: lib/supabase.ts ne contient PAS qcqbtmv"
    ERRORS=$((ERRORS + 1))
fi

if grep -q "mcstv" lib/supabase.ts; then
    echo "   ❌ ERREUR: lib/supabase.ts contient mcstv"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# 3. Vérifier app/api/storage/upload/route.ts
echo "3. Vérification de app/api/storage/upload/route.ts..."
if grep -q "qcqbtmvbvipsxwjlgjvk.supabase.co" app/api/storage/upload/route.ts; then
    echo "   ✅ API route hardcodée sur qcqbtmv"
else
    echo "   ❌ ERREUR: API route ne contient PAS qcqbtmv"
    ERRORS=$((ERRORS + 1))
fi

if grep -q "process.env.NEXT_PUBLIC_SUPABASE" app/api/storage/upload/route.ts; then
    echo "   ❌ ERREUR: API route utilise process.env (DANGEREUX)"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# 4. Chercher process.env dans les fichiers critiques
echo "4. Recherche de process.env dans app/ et lib/..."
FOUND_PROCESS_ENV=$(grep -r "process.env.NEXT_PUBLIC_SUPABASE" app/ lib/ 2>/dev/null | grep -v "node_modules" | wc -l)
if [ "$FOUND_PROCESS_ENV" -eq 0 ]; then
    echo "   ✅ Aucun process.env trouvé (sécurisé)"
else
    echo "   ❌ ERREUR: $FOUND_PROCESS_ENV fichier(s) utilisent process.env"
    echo "   Fichiers concernés:"
    grep -r "process.env.NEXT_PUBLIC_SUPABASE" app/ lib/ 2>/dev/null | grep -v "node_modules"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo "=========================================="

if [ $ERRORS -eq 0 ]; then
    echo "✅ SUCCÈS: Projet verrouillé sur qcqbtmv"
    echo "=========================================="
    exit 0
else
    echo "❌ ÉCHEC: $ERRORS erreur(s) détectée(s)"
    echo "=========================================="
    echo ""
    echo "ACTIONS À PRENDRE:"
    echo "1. Corriger le .env avec les credentials qcqbtmv"
    echo "2. Vérifier que lib/supabase.ts est hardcodé"
    echo "3. Vérifier que app/api/storage/upload/route.ts est hardcodé"
    echo "4. Supprimer tout usage de process.env dans app/ et lib/"
    echo ""
    echo "Voir: .bolt/SOLUTION-DEFINITIVE.md pour les détails"
    exit 1
fi
