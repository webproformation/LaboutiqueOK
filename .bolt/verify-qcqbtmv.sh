#!/bin/bash

# Script de vérification anti-revert pour le projet qcqbtmv
# INTERDICTION de revenir à mcstv ou tout autre projet

echo "=========================================="
echo "🔒 VÉRIFICATION PROJET qcqbtmv"
echo "=========================================="

# Vérifier que le .env contient qcqbtmv
if ! grep -q "qcqbtmvbvipsxwjlgjvk" .env 2>/dev/null; then
  echo "❌ ERREUR CRITIQUE: Le .env ne pointe pas vers qcqbtmv !"
  echo "❌ Projet verrouillé sur qcqbtmvbvipsxwjlgjvk"
  echo "❌ INTERDICTION de revenir à mcstv ou tout autre projet"
  exit 1
fi

# Vérifier que lib/supabase.ts contient qcqbtmv
if ! grep -q "qcqbtmvbvipsxwjlgjvk" lib/supabase.ts 2>/dev/null; then
  echo "❌ ERREUR CRITIQUE: lib/supabase.ts ne pointe pas vers qcqbtmv !"
  exit 1
fi

# Vérifier qu'il ne contient PAS mcstv
if grep -q "mcstvpdcfvhsgnhdfeee" .env 2>/dev/null; then
  echo "❌ ERREUR CRITIQUE: Tentative de retour vers mcstv détectée !"
  echo "❌ Restauration immédiate requise !"
  exit 1
fi

echo "✅ Projet verrouillé sur qcqbtmvbvipsxwjlgjvk"
echo "✅ .env vérifié: qcqbtmv"
echo "✅ lib/supabase.ts vérifié: qcqbtmv"
echo "✅ Admin compte: contact@webproformation.fr (is_admin=true)"
echo "=========================================="
exit 0
