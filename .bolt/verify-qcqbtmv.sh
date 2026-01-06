#!/bin/bash

echo "🔍 VÉRIFICATION D'INTÉGRITÉ : PROJET qcqbtmv"
echo "=============================================="
echo ""

if grep -q "qcqbtmvbvipsxwjlgjvk" .env; then
    echo "✅ .env pointe sur qcqbtmvbvipsxwjlgjvk.supabase.co"
else
    echo "❌ ERREUR : .env ne pointe PAS sur qcqbtmv !"
    exit 1
fi

if grep -q "qcqbtmvbvipsxwjlgjvk" lib/supabase.ts; then
    echo "✅ lib/supabase.ts utilise les credentials qcqbtmv hardcodés"
else
    echo "❌ ERREUR : lib/supabase.ts ne contient PAS qcqbtmv !"
    exit 1
fi

if grep -q "LOCKED_SUPABASE_URL = 'https://qcqbtmvbvipsxwjlgjvk.supabase.co'" lib/supabase.ts; then
    echo "✅ Singleton protégé avec credentials verrouillés"
else
    echo "⚠️  WARNING : Singleton non détecté ou non conforme"
fi

echo ""
echo "=============================================="
echo "✅ PROJET VALIDÉ : qcqbtmvbvipsxwjlgjvk"
echo "=============================================="
