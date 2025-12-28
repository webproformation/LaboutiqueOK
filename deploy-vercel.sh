#!/bin/bash

# Script de déploiement Vercel - La Boutique de Morgane
# Usage: bash deploy-vercel.sh

set -e

echo "🚀 Script de Déploiement Vercel"
echo "================================"
echo ""

# Vérifier que nous sommes dans le bon dossier
if [ ! -f "package.json" ]; then
  echo "❌ Erreur : package.json introuvable"
  echo "Assurez-vous d'être dans le dossier du projet"
  exit 1
fi

echo "✓ Dossier projet détecté"
echo ""

# Étape 1 : Build local pour vérifier
echo "📦 Étape 1/5 : Build local..."
npm run build
if [ $? -ne 0 ]; then
  echo "❌ Le build a échoué. Corrigez les erreurs avant de déployer."
  exit 1
fi
echo "✓ Build réussi"
echo ""

# Étape 2 : Git status
echo "📝 Étape 2/5 : Vérification Git..."
if [ ! -d ".git" ]; then
  echo "Git non initialisé. Initialisation..."
  git init
  echo "✓ Git initialisé"
fi

# Vérifier s'il y a des changements
if [[ -n $(git status -s) ]]; then
  echo "Changements détectés. Commit..."
  git add .
  git commit -m "Déploiement Vercel - $(date +'%Y-%m-%d %H:%M:%S')"
  echo "✓ Commit créé"
else
  echo "✓ Aucun changement à commiter"
fi
echo ""

# Étape 3 : Vérifier le remote
echo "🔗 Étape 3/5 : Vérification du remote GitHub..."
if ! git remote | grep -q "origin"; then
  echo ""
  echo "⚠️  Remote GitHub non configuré"
  echo ""
  echo "Actions requises :"
  echo "1. Créez un repo sur https://github.com/new"
  echo "2. Exécutez :"
  echo "   git remote add origin https://github.com/VOTRE_USERNAME/laboutiquedemorgane.git"
  echo "   git branch -M main"
  echo "   git push -u origin main"
  echo ""
  read -p "Appuyez sur Entrée quand c'est fait..."
else
  echo "✓ Remote GitHub configuré"
fi
echo ""

# Étape 4 : Push vers GitHub
echo "⬆️  Étape 4/5 : Push vers GitHub..."
git push origin main
echo "✓ Code pushé sur GitHub"
echo ""

# Étape 5 : Instructions Vercel
echo "🌐 Étape 5/5 : Déploiement Vercel"
echo ""
echo "Maintenant, suivez ces étapes sur Vercel :"
echo ""
echo "1. Allez sur https://vercel.com/new"
echo "2. Importez votre repo GitHub : laboutiquedemorgane"
echo "3. AVANT de cliquer Deploy, ajoutez les variables d'environnement :"
echo ""
echo "   Variables requises (copiez depuis votre .env) :"
echo "   - NEXT_PUBLIC_WORDPRESS_API_URL"
echo "   - WORDPRESS_API_URL"
echo "   - WOOCOMMERCE_URL"
echo "   - WOOCOMMERCE_CONSUMER_KEY"
echo "   - WOOCOMMERCE_CONSUMER_SECRET"
echo "   - NEXT_PUBLIC_SUPABASE_URL"
echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "   - SUPABASE_SERVICE_ROLE_KEY"
echo "   (+ toutes les autres de votre .env)"
echo ""
echo "4. Cliquez sur Deploy"
echo "5. Attendez 5-10 minutes"
echo "6. Ajoutez votre domaine : Settings → Domains"
echo "7. Configurez le DNS selon les instructions Vercel"
echo ""
echo "📖 Guide complet : GUIDE_DEPLOIEMENT_VERCEL_ETAPES.md"
echo ""
echo "✅ Préparation terminée !"
