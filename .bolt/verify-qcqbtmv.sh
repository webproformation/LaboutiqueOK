#!/bin/bash

echo "🔒 Vérification du verrouillage projet qcqbtmvbvipsxwjlgjvk"
echo "=========================================================="

# Vérifier le .env
if grep -q "qcqbtmvbvipsxwjlgjvk" .env 2>/dev/null; then
    echo "✅ .env verrouillé sur qcqbtmvbvipsxwjlgjvk"
else
    echo "❌ ERREUR: .env ne pointe PAS vers qcqbtmvbvipsxwjlgjvk!"
    exit 1
fi

# Vérifier lib/supabase.ts
if grep -q "qcqbtmvbvipsxwjlgjvk" lib/supabase.ts 2>/dev/null; then
    echo "✅ lib/supabase.ts verrouillé sur qcqbtmvbvipsxwjlgjvk"
else
    echo "⚠️  lib/supabase.ts ne contient pas de référence directe (utilise .env)"
fi

echo ""
echo "✅ VÉRIFICATION RÉUSSIE - Projet verrouillé sur qcqbtmvbvipsxwjlgjvk"
echo "=========================================================="
