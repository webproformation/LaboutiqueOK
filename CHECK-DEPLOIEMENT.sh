#!/bin/bash

echo "🔍 VÉRIFICATION RAPIDE DU DÉPLOIEMENT"
echo "======================================"
echo ""

echo "1️⃣ Vérification .env projet..."
PROJECT_ID=$(grep NEXT_PUBLIC_SUPABASE_URL .env | grep -o 'qcqbtmv[^.]*')
if [ "$PROJECT_ID" == "qcqbtmvbvipsxwjlgjvk" ]; then
  echo "✅ Projet correct: qcqbtmvbvipsxwjlgjvk"
else
  echo "❌ ERREUR: Mauvais projet ($PROJECT_ID)"
  exit 1
fi
echo ""

echo "2️⃣ Vérification fichiers créés..."
FILES=(
  "hooks/use-guestbook.ts"
  "hooks/use-returns.ts"
  "hooks/use-looks.ts"
  "hooks/use-gift-progress.ts"
  "app/livre-dor/page.tsx"
  "app/admin/guestbook/page.tsx"
)

MISSING=0
for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    SIZE=$(wc -l < "$file")
    echo "✅ $file ($SIZE lignes)"
  else
    echo "❌ MANQUANT: $file"
    MISSING=$((MISSING + 1))
  fi
done
echo ""

if [ $MISSING -gt 0 ]; then
  echo "❌ $MISSING fichiers manquants"
  exit 1
fi

echo "3️⃣ Test compilation..."
npm run build > /tmp/build.log 2>&1
if [ $? -eq 0 ]; then
  echo "✅ Build réussi"
  grep "livre-dor" /tmp/build.log | head -1
  grep "admin/guestbook" /tmp/build.log | head -1
else
  echo "❌ Erreur de build"
  tail -20 /tmp/build.log
  exit 1
fi
echo ""

echo "======================================"
echo "✅ TOUT EST PRÊT POUR LE DÉPLOIEMENT"
echo "======================================"
echo ""
echo "Pour déployer:"
echo "  git add ."
echo "  git commit -m 'feat: Livre d Or + Retours + Looks'"
echo "  git push origin main"
