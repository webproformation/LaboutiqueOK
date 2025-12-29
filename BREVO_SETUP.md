# Configuration BREVO pour les Emails de Promotion Croisée

## Étape 1 : Obtenir la Clé API BREVO

1. Créer un compte sur [Brevo (ex-Sendinblue)](https://www.brevo.com)
2. Se connecter au dashboard
3. Aller dans **Settings** → **SMTP & API** → **API Keys**
4. Créer une nouvelle clé API avec les permissions d'envoi d'emails
5. Copier la clé API (format: `xkeysib-xxxxxx...`)

## Étape 2 : Configurer la Clé dans Supabase

1. Aller dans le dashboard Supabase
2. Sélectionner le projet
3. Aller dans **Settings** → **Edge Functions** → **Secrets**
4. Ajouter un nouveau secret :
   - Nom : `BREVO_API_KEY`
   - Valeur : votre clé API BREVO

## Étape 3 : Tester l'Envoi d'Emails

L'edge function `send-cross-promotion-email` est déjà déployée et prête à l'emploi.

Pour tester manuellement :

```bash
curl -X POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-cross-promotion-email' \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "userEmail": "test@example.com",
    "userName": "Test User",
    "couponCode": "LIVE2SITE-12345678",
    "couponType": "live_to_site",
    "expiryDate": "2024-12-25T00:00:00Z"
  }'
```

## Étape 4 : Intégration Automatique

L'envoi automatique des emails se fait après la validation d'une commande. Pour l'implémenter :

### Option 1 : Trigger après création de commande (Recommandé)

Créer un trigger SQL qui appelle l'edge function automatiquement :

```sql
CREATE OR REPLACE FUNCTION send_cross_promotion_email_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_email text;
  v_user_name text;
  v_coupon record;
  v_order_source text;
BEGIN
  -- Déterminer la source de la commande
  -- TODO: Ajouter une colonne 'source' dans la table orders
  -- Pour l'instant, on suppose 'site' par défaut
  v_order_source := COALESCE(NEW.source, 'site');

  -- Créer le coupon de promotion croisée
  SELECT * INTO v_coupon
  FROM create_cross_promotion_coupon(
    NEW.user_id,
    NEW.order_number,
    v_order_source
  );

  -- Récupérer les infos utilisateur
  SELECT
    COALESCE(p.first_name || ' ' || p.last_name, split_part(u.email, '@', 1)) as name,
    u.email
  INTO v_user_name, v_user_email
  FROM auth.users u
  LEFT JOIN profiles p ON p.id = u.id
  WHERE u.id = NEW.user_id;

  -- Appeler l'edge function pour envoyer l'email
  -- Note: Utiliser pg_net ou http extension pour appeler l'edge function
  -- Ceci nécessite l'extension pg_net

  RETURN NEW;
END;
$$;

-- Créer le trigger
CREATE TRIGGER after_order_validated
  AFTER INSERT ON orders
  FOR EACH ROW
  WHEN (NEW.status = 'completed' OR NEW.status = 'processing')
  EXECUTE FUNCTION send_cross_promotion_email_trigger();
```

### Option 2 : Appel depuis l'application

Dans le code de validation de commande, appeler l'edge function :

```typescript
// Après validation de la commande
const couponResponse = await supabase.rpc('create_cross_promotion_coupon', {
  p_user_id: userId,
  p_order_id: orderNumber,
  p_order_source: orderSource // 'live' ou 'site'
});

if (couponResponse.data?.success) {
  // Envoyer l'email via l'edge function
  await fetch(`${supabaseUrl}/functions/v1/send-cross-promotion-email`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userEmail: user.email,
      userName: user.name,
      couponCode: couponResponse.data.coupon_code,
      couponType: couponResponse.data.coupon_type,
      expiryDate: couponResponse.data.valid_until
    })
  });
}
```

## Configuration de l'Expéditeur

Dans Brevo, configurer l'expéditeur :

1. Aller dans **Settings** → **Senders & IPs**
2. Ajouter un nouvel expéditeur :
   - Email : `noreply@laboutiquedemorgane.fr`
   - Nom : `La Boutique de Morgane`
3. Valider l'email en cliquant sur le lien reçu

## Templates d'Emails

Les templates HTML sont déjà intégrés dans l'edge function avec :

### Email Live → Site
- **Objet :** "Une petite surprise t'attend sur le site ! 🎁"
- **Contenu :** Notification du coupon avec lien vers le site
- **CTA :** Bouton "Découvrir le Site"

### Email Site → Live
- **Objet :** "Rejoins-nous en live pour ta prochaine commande ! ✨"
- **Contenu :** Notification du coupon avec lien vers la page live
- **CTA :** Bouton "Voir les Lives"

## Personnalisation des Emails

Pour modifier les templates, éditer le fichier :
`supabase/functions/send-cross-promotion-email/index.ts`

Puis redéployer :
```bash
# Via l'interface admin ou via CLI
supabase functions deploy send-cross-promotion-email
```

## Monitoring

1. Dashboard Brevo : Voir les statistiques d'envoi, ouvertures, clics
2. Logs Supabase : Voir les appels à l'edge function
3. Table `cross_promotion_coupons` : Voir les coupons créés et utilisés

## Troubleshooting

### L'email n'est pas envoyé
- Vérifier que la clé API BREVO est correctement configurée dans Supabase
- Vérifier les logs de l'edge function dans Supabase
- Vérifier que l'expéditeur est validé dans Brevo

### L'email arrive en spam
- Configurer SPF, DKIM et DMARC dans les DNS
- Utiliser un domaine professionnel vérifié
- Éviter les mots spam dans l'objet et le contenu

### Le coupon n'est pas créé
- Vérifier les logs SQL
- Vérifier que la fonction `create_cross_promotion_coupon` existe
- Vérifier que l'utilisateur et la commande existent

## Notes Importantes

- Les emails sont envoyés de manière asynchrone
- Un échec d'envoi n'empêche pas la création du coupon
- Les utilisateurs peuvent toujours voir leurs coupons dans leur compte
- Les coupons expirent automatiquement après 4 jours