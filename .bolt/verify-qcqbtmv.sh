#!/bin/bash

# 🔒 SCRIPT DE VÉRIFICATION DU VERROUILLAGE PROJET qcqbtmvbvipsxwjlgjvk

PROJECT_ID="qcqbtmvbvipsxwjlgjvk"
ENV_FILE=".env"

echo "🔍 Vérification du verrouillage projet..."

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ ERREUR: Fichier .env introuvable"
  exit 1
fi

if ! grep -q "NEXT_PUBLIC_SUPABASE_URL=https://$PROJECT_ID.supabase.co" "$ENV_FILE"; then
  echo "❌ ERREUR: Le projet n'est pas verrouillé sur $PROJECT_ID"
  exit 1
fi

echo "✅ Verrouillage confirmé: $PROJECT_ID"
exit 0
