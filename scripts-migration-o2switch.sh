#!/bin/bash

# Script de migration automatique vers O2Switch
# Ce script met à jour toutes les références de l'ancienne URL vers la nouvelle

echo "=========================================="
echo "Migration vers O2Switch"
echo "=========================================="
echo ""

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# URLs
OLD_URL="laboutiquedemorgane.webprocreation.fr"
NEW_URL="wp.laboutiquedemorgane.com"

echo -e "${YELLOW}⚠️  ATTENTION : Ce script va modifier plusieurs fichiers${NC}"
echo ""
echo "Ancienne URL : $OLD_URL"
echo "Nouvelle URL : $NEW_URL"
echo ""
read -p "Voulez-vous continuer ? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo -e "${RED}❌ Annulé${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🔄 Remplacement des URLs...${NC}"
echo ""

# Liste des fichiers à modifier
FILES=(
    "supabase/functions/get-checkout-options/index.ts"
    "supabase/functions/get-invoice-url/index.ts"
    "supabase/functions/list-wordpress-users/index.ts"
    "supabase/functions/validate-delivery-batch/index.ts"
    "app/le-droit-a-lerreur/page.tsx"
    "app/transactions-protegees/page.tsx"
    "app/admin/diagnostic/page.tsx"
    "app/vite-chez-vous/page.tsx"
    "app/allo-morgane/page.tsx"
    "components/Footer.tsx"
    "next.config.js"
    "IMAGE_OPTIMIZATION_GUIDE.md"
    "PRODUCTION_DEBUGGING.md"
)

# Compteur
COUNT=0

# Remplacement dans chaque fichier
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        # Backup du fichier
        cp "$file" "$file.backup"

        # Remplacement
        sed -i "s/$OLD_URL/$NEW_URL/g" "$file"

        if [ $? -eq 0 ]; then
            echo -e "  ${GREEN}✓${NC} $file"
            COUNT=$((COUNT+1))
        else
            echo -e "  ${RED}✗${NC} Erreur dans $file"
            # Restaurer le backup en cas d'erreur
            mv "$file.backup" "$file"
        fi
    else
        echo -e "  ${YELLOW}⚠${NC}  Fichier non trouvé : $file"
    fi
done

echo ""
echo -e "${GREEN}✓ $COUNT fichiers mis à jour${NC}"
echo ""

# Vérification du .env
echo -e "${YELLOW}📝 Configuration du fichier .env${NC}"
echo ""

if [ -f ".env" ]; then
    echo "Le fichier .env existe. Voulez-vous le mettre à jour ? (y/n)"
    read -p "> " -n 1 -r
    echo ""

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cp ".env" ".env.backup"
        sed -i "s/$OLD_URL/$NEW_URL/g" ".env"
        echo -e "${GREEN}✓ .env mis à jour${NC}"
        echo ""
        echo -e "${YELLOW}⚠️  IMPORTANT : Vous devez maintenant :${NC}"
        echo "  1. Régénérer les clés API WooCommerce sur le nouveau WordPress"
        echo "  2. Mettre à jour WOOCOMMERCE_CONSUMER_KEY et WOOCOMMERCE_CONSUMER_SECRET"
        echo "  3. Mettre à jour WORDPRESS_APP_PASSWORD si nécessaire"
        echo ""
    fi
else
    echo -e "${RED}⚠️  Fichier .env non trouvé${NC}"
    echo "Copiez .env.example vers .env et configurez-le manuellement"
fi

echo ""
echo -e "${GREEN}=========================================="
echo "✓ Migration terminée !"
echo "==========================================${NC}"
echo ""
echo "Prochaines étapes :"
echo "  1. Vérifiez les fichiers modifiés"
echo "  2. Testez l'application localement"
echo "  3. Mettez à jour les secrets Supabase"
echo "  4. Déployez sur Vercel"
echo ""
echo "En cas de problème, les backups sont dans *.backup"
echo ""
