#!/bin/bash

# Script de redéploiement automatique des Edge Functions Supabase
# Instance cible : qcqbtmvbvipsxwjlgjvk.supabase.co

echo "🚀 Début du redéploiement des Edge Functions sur qcqbtmvbvipsxwjlgjvk.supabase.co"
echo ""

# Vérifier que Supabase CLI est installé
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI n'est pas installé"
    echo "Installez-le avec: npm install -g supabase"
    exit 1
fi

# Se connecter à Supabase (si pas déjà connecté)
echo "📡 Vérification de la connexion Supabase..."
supabase link --project-ref qcqbtmvbvipsxwjlgjvk

# Liste des fonctions à déployer
FUNCTIONS=(
    "add-woocommerce-attribute-term"
    "automated-backup"
    "award-daily-bonus"
    "capture-paypal-order"
    "check-customer-status"
    "create-admin-role"
    "create-admin-user"
    "create-backup"
    "create-payment-intent"
    "create-paypal-order"
    "create-woocommerce-order"
    "create-wordpress-user"
    "debug-env"
    "delete-backup"
    "delete-wordpress-media"
    "generate-order-invoice"
    "get-cart-items"
    "get-checkout-options"
    "get-delivery-batches"
    "get-invoice-url"
    "get-loyalty-tier"
    "get-user-role"
    "get-woocommerce-attributes"
    "get-woocommerce-categories"
    "handle-order-cancellation"
    "list-supabase-users"
    "list-wordpress-users"
    "manage-woocommerce-customers"
    "manage-woocommerce-orders"
    "manage-woocommerce-products"
    "manage-wordpress-posts"
    "mondial-relay-api"
    "reset-admin-password"
    "restore-backup"
    "send-cross-promotion-email"
    "send-login-sms"
    "send-order-invoice-email"
    "send-push-notification"
    "send-return-confirmation-email"
    "send-return-finalized-email"
    "sync-woocommerce-customer"
    "test-secrets"
    "update-wordpress-user"
    "upload-wordpress-media"
    "validate-delivery-batch"
    "webhook-revalidator"
)

TOTAL=${#FUNCTIONS[@]}
DEPLOYED=0
FAILED=0

echo "📦 ${TOTAL} fonctions à déployer"
echo ""

# Déployer chaque fonction
for FUNC in "${FUNCTIONS[@]}"; do
    echo "⏳ Déploiement de ${FUNC}..."

    if supabase functions deploy ${FUNC} --no-verify-jwt 2>&1 | tee /tmp/deploy-${FUNC}.log; then
        DEPLOYED=$((DEPLOYED + 1))
        echo "✅ ${FUNC} déployé avec succès (${DEPLOYED}/${TOTAL})"
    else
        FAILED=$((FAILED + 1))
        echo "❌ Échec du déploiement de ${FUNC}"
        echo "   Voir les logs dans /tmp/deploy-${FUNC}.log"
    fi

    echo ""
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Résumé du déploiement"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Déployés : ${DEPLOYED}/${TOTAL}"
echo "❌ Échecs   : ${FAILED}/${TOTAL}"
echo ""

if [ ${FAILED} -eq 0 ]; then
    echo "🎉 Toutes les fonctions ont été déployées avec succès!"
else
    echo "⚠️  Certaines fonctions ont échoué. Vérifiez les logs dans /tmp/"
fi
