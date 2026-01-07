#!/bin/bash

# Script de vérification du projet qcqbtmv
# INTERDICTION ABSOLUE de retourner sur mcstv

echo ""
echo "=========================================="
echo "VÉRIFICATION PROJET qcqbtmvbvipsxwjlgjvk"
echo "=========================================="
echo ""

# Vérifier le .env
if grep -q "qcqbtmvbvipsxwjlgjvk" .env; then
    echo "✅ .env pointe sur qcqbtmv"
else
    echo "❌ ALERTE: .env ne pointe PAS sur qcqbtmv !!!"
    echo ""
    echo "Contenu actuel de NEXT_PUBLIC_SUPABASE_URL:"
    grep "NEXT_PUBLIC_SUPABASE_URL" .env
    echo ""
    exit 1
fi

# Vérifier qu'il n'y a pas de référence à mcstv
if grep -q "mcstvpdcfvhsgnhdfeee" .env; then
    echo "❌ CORRUPTION DÉTECTÉE: référence à mcstv trouvée !!!"
    exit 1
fi

echo "✅ Aucune référence à mcstv trouvée"
echo ""
echo "Configuration correcte:"
grep "NEXT_PUBLIC_SUPABASE_URL" .env
echo ""
echo "=========================================="
echo "PROJET VERROUILLÉ SUR qcqbtmv"
echo "=========================================="
echo ""

exit 0
