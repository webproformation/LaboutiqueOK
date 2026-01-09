#!/bin/bash

# Script de vérification d'intégrité projet qcqbtmv
# INTERDICTION FORMELLE de retourner sur mcstv

PROJECT_ID="qcqbtmvbvipsxwjlgjvk"
EXPECTED_URL="https://qcqbtmvbvipsxwjlgjvk.supabase.co"

# Vérification du fichier .env
if [ ! -f .env ]; then
  echo "❌ ERREUR: Fichier .env manquant!"
  exit 1
fi

# Extraction de l'URL depuis .env
CURRENT_URL=$(grep "NEXT_PUBLIC_SUPABASE_URL" .env | cut -d '=' -f2)

# Vérification
if [[ "$CURRENT_URL" != "$EXPECTED_URL" ]]; then
  echo "❌ ERREUR CRITIQUE: Mauvais projet détecté!"
  echo "   Attendu: $EXPECTED_URL"
  echo "   Détecté: $CURRENT_URL"
  echo ""
  echo "🚨 INTERDICTION de revenir sur mcstv ou tout autre projet"
  exit 1
fi

# Vérification lib/supabase.ts
if [ -f lib/supabase.ts ]; then
  if ! grep -q "qcqbtmvbvipsxwjlgjvk" lib/supabase.ts; then
    echo "❌ ERREUR: lib/supabase.ts ne contient pas qcqbtmvbvipsxwjlgjvk"
    exit 1
  fi
fi

echo "✅ VÉRIFICATION RÉUSSIE: Projet qcqbtmvbvipsxwjlgjvk"
echo "   URL: $CURRENT_URL"
exit 0
