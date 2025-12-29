# Configuration des Secrets Supabase

Ce guide explique comment configurer les secrets nécessaires pour les Edge Functions Supabase.

## Secret BREVO_API_KEY

Pour que l'envoi d'emails de factures fonctionne, vous devez configurer la clé API Brevo dans les secrets Supabase.

### Étapes de configuration :

1. **Accéder au Dashboard Supabase**
   - Allez sur https://app.supabase.com
   - Sélectionnez votre projet

2. **Naviguer vers les Settings**
   - Dans le menu de gauche, cliquez sur "Settings" (icône d'engrenage en bas)
   - Sélectionnez "Edge Functions"

3. **Ajouter le Secret**
   - Cliquez sur "Add Secret" ou "Manage Secrets"
   - Nom du secret : `BREVO_API_KEY`
   - Valeur : `VOTRE_CLE_API_BREVO_ICI`
   - Cliquez sur "Save" ou "Add"

4. **Vérifier la configuration**
   - Le secret devrait maintenant apparaître dans la liste
   - Les Edge Functions utiliseront automatiquement ce secret

### Alternative : Via CLI Supabase

Si vous préférez utiliser la ligne de commande :

```bash
# Se connecter à Supabase
npx supabase login

# Définir le secret
npx supabase secrets set BREVO_API_KEY=VOTRE_CLE_API_BREVO_ICI
```

## Vérification

Une fois le secret configuré :

1. Allez dans l'admin des commandes
2. Cliquez sur "Envoyer au client" pour une commande avec un bon de commande
3. L'email devrait maintenant être envoyé sans erreur

## Autres secrets disponibles

Les Edge Functions ont également accès automatiquement à ces secrets système :
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_DB_URL`

Ces secrets sont préconfigurés par Supabase et n'ont pas besoin d'être définis manuellement.

## Dépannage

Si vous rencontrez toujours l'erreur "Email service not configured" après avoir configuré le secret :

1. Vérifiez que le nom du secret est exactement `BREVO_API_KEY` (sensible à la casse)
2. Redéployez les Edge Functions si nécessaire
3. Attendez quelques minutes que les changements se propagent
4. Vérifiez les logs de l'Edge Function dans le dashboard Supabase
