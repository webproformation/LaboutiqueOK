#!/bin/bash

# 🔒 VÉRIFICATION ANCRAGE qcqbtmv
# Ce script vérifie que le projet est bien sur qcqbtmvbvipsxwjlgjvk

echo "🔍 VÉRIFICATION ANCRAGE qcqbtmv"
echo "================================"
echo ""

# Vérifier si .env existe
if [ ! -f .env ]; then
    echo "❌ ERREUR : Fichier .env introuvable !"
    exit 1
fi

# Extraire l'URL Supabase
CURRENT_URL=$(grep "NEXT_PUBLIC_SUPABASE_URL" .env | cut -d '=' -f2)
EXPECTED_URL="https://qcqbtmvbvipsxwjlgjvk.supabase.co"

echo "URL Actuelle  : $CURRENT_URL"
echo "URL Attendue  : $EXPECTED_URL"
echo ""

# Comparer
if [ "$CURRENT_URL" = "$EXPECTED_URL" ]; then
    echo "✅ ANCRAGE CORRECT : qcqbtmvbvipsxwjlgjvk"
    echo ""
    echo "📌 Projet verrouillé sur le bon environnement"
    echo "🔐 Prêt pour les opérations"
    exit 0
else
    echo "❌ ERREUR : PROJET SUR MAUVAIS ENVIRONNEMENT !"
    echo ""
    echo "🚨 ACTION REQUISE :"
    echo "   1. Ouvrir .env"
    echo "   2. Remplacer l'URL par : $EXPECTED_URL"
    echo "   3. Relancer ce script"
    echo ""
    exit 1
fi
