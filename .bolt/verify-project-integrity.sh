#!/bin/bash

# Script de vérification de l'intégrité du projet
# À exécuter AVANT toute modification importante

echo "🔍 VÉRIFICATION DE L'INTÉGRITÉ DU PROJET..."
echo ""

# Vérifier le projet Supabase
CURRENT_URL=$(grep "NEXT_PUBLIC_SUPABASE_URL" .env | cut -d'=' -f2)
EXPECTED_URL="https://qcqbtmvbvipsxwjlgjvk.supabase.co"

if [ "$CURRENT_URL" != "$EXPECTED_URL" ]; then
    echo "❌ ERREUR CRITIQUE : Mauvais projet Supabase détecté !"
    echo "   Actuel  : $CURRENT_URL"
    echo "   Attendu : $EXPECTED_URL"
    echo ""
    echo "⚠️  ARRÊT IMMÉDIAT - NE PAS CONTINUER"
    echo "⚠️  Corriger le .env avant toute action"
    exit 1
fi

echo "✅ Projet Supabase : qcqbtmvbvipsxwjlgjvk (CORRECT)"
echo ""

# Vérifier que mcstv n'est pas utilisé comme URL active (ignorer les commentaires)
if grep "^NEXT_PUBLIC_SUPABASE_URL" .env | grep -q "mcstv"; then
    echo "❌ ERREUR : mcstv utilisé comme URL Supabase active !"
    echo "⚠️  ARRÊT IMMÉDIAT"
    exit 1
fi

if grep "^NEXT_PUBLIC_SUPABASE_ANON_KEY.*mcstv" .env | grep -q "mcstv"; then
    echo "❌ ERREUR : Clé mcstv active détectée !"
    echo "⚠️  ARRÊT IMMÉDIAT"
    exit 1
fi

echo "✅ Aucune URL mcstv active"
echo ""
echo "✅ VÉRIFICATION RÉUSSIE - Projet qcqbtmvbvipsxwjlgjvk confirmé"
echo ""

exit 0
