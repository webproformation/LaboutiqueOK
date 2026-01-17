# 📧 GUIDE - Configuration des Emails Automatiques

**Date :** 2026-01-16
**Projet :** qcqbtmvbvipsxwjlgjvk
**Statut :** Configuration requise

---

## ✅ CE QUI EST DÉJÀ EN PLACE

Votre système d'emails est **déjà configuré et fonctionnel** :

### 1. Configuration SMTP ✅
```env
SMTP_HOST=mail.smtp2go.com
SMTP_PORT=587
SMTP_USER=webpro@chillax.fr
SMTP_PASSWORD=chillaxfr68
SMTP_FROM=noreply@laboutiquedemorgane.com
```

### 2. Templates d'emails disponibles ✅
- ✅ Confirmation de commande (`OrderConfirmationEmail`)
- ✅ Email de bienvenue (`WelcomeEmail`)
- ✅ Email d'expédition (`ShippingEmail`)
- ✅ Colis ouvert (`OpenPackageStartEmail`, `OpenPackageAddEmail`)
- ✅ Click & Collect prêt (`ClickAndCollectEmail`)
- ✅ Panier abandonné (`AbandonedCartEmail`)
- ✅ Fermeture colis (`PackageClosingWarningEmail`)
- ✅ Demande d'avis (`ReviewRequestEmail`)
- ✅ Réinitialisation mot de passe (`PasswordResetEmail`)
- ✅ Diamant trouvé (`DiamondFoundEmail`)

### 3. Fonctions d'envoi ✅
Fichier : `lib/email-sender.ts`
- Toutes les fonctions sont prêtes à l'emploi
- Utilise Nodemailer avec SMTP2GO

### 4. Webhook Stripe ✅
**Fichier :** `app/api/stripe/webhook/route.ts:110-133`

L'email de confirmation est **DÉJÀ envoyé automatiquement** quand le paiement Stripe réussit :
```typescript
await sendOrderConfirmationEmail(orderDetails.profiles.email, {
  orderId: orderDetails.order_number || orderId,
  customerName: `${orderDetails.profiles.first_name || ''} ${orderDetails.profiles.last_name || ''}`.trim(),
  items,
  total: orderDetails.total_amount,
  shippingAddress,
});
```

---

## 🔧 CE QUI MANQUE (À CONFIGURER)

### 1. ❌ Envoi automatique lors du changement de statut de commande

**Besoin :** Envoyer un email d'expédition quand le statut passe à "shipped".

### 2. ❌ Envoi automatique de l'email de bienvenue

**Besoin :** Envoyer un email quand un utilisateur s'inscrit.

### 3. ❌ Tâches programmées (CRON Jobs)

**Besoin :**
- Email panier abandonné (24h après abandon)
- Email demande d'avis (7 jours après livraison)
- Email fermeture colis (1 jour avant)

---

## 🚀 SOLUTION 1 : Triggers Supabase (AUTOMATIQUE)

### Étape 1 : Créer une fonction PostgreSQL pour l'envoi d'emails

**Créer cette migration :** `supabase/migrations/create_email_triggers.sql`

```sql
/*
  # Système d'envoi automatique d'emails

  1. Nouvelles fonctions
    - `send_email_notification` : Trigger pour envoyer des emails via webhook
    - `send_order_status_email` : Envoi email quand statut commande change
    - `send_welcome_email` : Envoi email de bienvenue à l'inscription

  2. Triggers
    - orders : Déclenchement sur update du statut
    - profiles : Déclenchement sur insertion (nouvel utilisateur)
*/

-- Fonction générique d'appel à l'API d'envoi d'emails
CREATE OR REPLACE FUNCTION send_email_notification(
  email_type TEXT,
  recipient_email TEXT,
  data JSONB
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  api_url TEXT;
BEGIN
  -- URL de base de votre application
  api_url := current_setting('app.settings.api_url', true);

  IF api_url IS NULL THEN
    api_url := 'https://laboutiquedemorgane.com';
  END IF;

  -- Appel asynchrone à l'API d'envoi d'emails
  PERFORM
    net.http_post(
      url := api_url || '/api/emails/' || email_type,
      headers := jsonb_build_object(
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object(
        'to', recipient_email,
        'data', data
      )
    );
END;
$$;

-- Fonction pour envoyer un email de bienvenue
CREATE OR REPLACE FUNCTION send_welcome_email_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Vérifier que l'email existe
  IF NEW.email IS NOT NULL AND NEW.email != '' THEN
    -- Envoyer l'email de bienvenue
    PERFORM send_email_notification(
      'welcome',
      NEW.email,
      jsonb_build_object(
        'firstName', COALESCE(NEW.first_name, 'Voisine')
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Fonction pour envoyer un email lors du changement de statut de commande
CREATE OR REPLACE FUNCTION send_order_status_email_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_email TEXT;
  user_first_name TEXT;
BEGIN
  -- Récupérer l'email et le prénom de l'utilisateur
  SELECT p.email, p.first_name
  INTO user_email, user_first_name
  FROM profiles p
  WHERE p.id = NEW.user_id;

  -- Si le statut passe à "shipped" (expédié)
  IF NEW.status = 'shipped' AND OLD.status != 'shipped' THEN
    IF user_email IS NOT NULL THEN
      PERFORM send_email_notification(
        'shipping',
        user_email,
        jsonb_build_object(
          'firstName', COALESCE(user_first_name, 'Voisine'),
          'trackingNumber', COALESCE(NEW.tracking_number, 'Non disponible')
        )
      );
    END IF;
  END IF;

  -- Si le statut passe à "ready_for_pickup" (Click & Collect)
  IF NEW.status = 'ready_for_pickup' AND OLD.status != 'ready_for_pickup' THEN
    IF user_email IS NOT NULL THEN
      PERFORM send_email_notification(
        'click-and-collect',
        user_email,
        jsonb_build_object(
          'firstName', COALESCE(user_first_name, 'Voisine')
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger : Envoyer email de bienvenue à l'inscription
DROP TRIGGER IF EXISTS on_user_created_send_welcome_email ON profiles;
CREATE TRIGGER on_user_created_send_welcome_email
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION send_welcome_email_trigger();

-- Trigger : Envoyer email lors du changement de statut de commande
DROP TRIGGER IF EXISTS on_order_status_changed_send_email ON orders;
CREATE TRIGGER on_order_status_changed_send_email
  AFTER UPDATE ON orders
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION send_order_status_email_trigger();
```

**⚠️ IMPORTANT :** Cette migration utilise `net.http_post` qui nécessite l'extension `pg_net`. Activez-la dans Supabase Dashboard :
1. Allez dans **Database** > **Extensions**
2. Activez **pg_net**

### Étape 2 : Créer les routes API manquantes

Les routes existent déjà, mais on doit ajouter les routes pour welcome et shipping :

**Fichier :** `app/api/emails/welcome/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { sendWelcomeEmail } from '@/lib/email-sender';

export async function POST(request: NextRequest) {
  try {
    const { to, data } = await request.json();

    if (!to) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const result = await sendWelcomeEmail(
      to,
      data.firstName || 'Voisine'
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId
    });
  } catch (error: any) {
    console.error('Error in welcome email API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**Fichier :** `app/api/emails/shipping/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { sendShippingEmail } from '@/lib/email-sender';

export async function POST(request: NextRequest) {
  try {
    const { to, data } = await request.json();

    if (!to) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const result = await sendShippingEmail(
      to,
      data.firstName || 'Voisine',
      data.trackingNumber || 'Non disponible',
      data.trackingUrl
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId
    });
  } catch (error: any) {
    console.error('Error in shipping email API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## 🚀 SOLUTION 2 : Edge Functions pour les CRON Jobs

Pour les emails programmés (panier abandonné, demande d'avis), utilisez les Edge Functions Supabase avec des CRON jobs.

### Étape 1 : Créer l'Edge Function pour les paniers abandonnés

**Fichier :** `supabase/functions/send-abandoned-cart-emails/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Récupérer les paniers abandonnés depuis plus de 24h
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const { data: carts, error } = await supabase
      .from('cart_items')
      .select(`
        user_id,
        created_at,
        profiles!inner(email, first_name)
      `)
      .lt('created_at', twentyFourHoursAgo.toISOString())
      .is('email_sent', false)
      .limit(50);

    if (error) throw error;

    // Grouper par utilisateur
    const userCarts = new Map();
    for (const cart of carts || []) {
      if (!userCarts.has(cart.user_id)) {
        userCarts.set(cart.user_id, {
          email: cart.profiles.email,
          firstName: cart.profiles.first_name,
        });
      }
    }

    // Envoyer les emails
    const apiUrl = Deno.env.get('NEXT_PUBLIC_APP_URL') || 'https://laboutiquedemorgane.com';

    for (const [userId, userData] of userCarts) {
      await fetch(`${apiUrl}/api/emails/abandoned-cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: userData.email,
          data: { firstName: userData.firstName }
        })
      });

      // Marquer comme envoyé
      await supabase
        .from('cart_items')
        .update({ email_sent: true })
        .eq('user_id', userId);
    }

    return new Response(
      JSON.stringify({ success: true, emailsSent: userCarts.size }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

### Étape 2 : Déployer l'Edge Function

```bash
# Depuis votre terminal
supabase functions deploy send-abandoned-cart-emails --project-ref qcqbtmvbvipsxwjlgjvk
```

### Étape 3 : Configurer le CRON Job

Dans Supabase Dashboard :
1. Allez dans **Edge Functions**
2. Sélectionnez `send-abandoned-cart-emails`
3. Cliquez sur **Configure**
4. Ajoutez un CRON schedule : `0 10 * * *` (tous les jours à 10h)

---

## 📋 RÉSUMÉ DES ACTIONS À FAIRE

| Action | Priorité | Statut |
|--------|----------|--------|
| Activer extension `pg_net` dans Supabase | 🔴 Haute | ❌ À faire |
| Appliquer migration `create_email_triggers.sql` | 🔴 Haute | ❌ À faire |
| Créer route API `/api/emails/welcome` | 🟡 Moyenne | ❌ À faire |
| Créer route API `/api/emails/shipping` | 🟡 Moyenne | ❌ À faire |
| Créer Edge Function `send-abandoned-cart-emails` | 🟢 Basse | ❌ À faire |
| Configurer CRON Job pour panier abandonné | 🟢 Basse | ❌ À faire |
| Tester l'envoi d'email de bienvenue | 🔴 Haute | ❌ À faire |
| Tester l'envoi d'email d'expédition | 🔴 Haute | ❌ À faire |

---

## 🧪 TESTS À EFFECTUER

### Test 1 : Email de bienvenue
```bash
# Créer un nouvel utilisateur dans Supabase Dashboard
# L'email devrait être envoyé automatiquement
```

### Test 2 : Email d'expédition
```sql
-- Dans l'éditeur SQL de Supabase
UPDATE orders
SET status = 'shipped', tracking_number = 'TEST123456'
WHERE id = 'votre_order_id';
-- L'email devrait être envoyé automatiquement
```

### Test 3 : Email de confirmation (Stripe)
```bash
# Faire un achat test avec Stripe
# L'email est DÉJÀ automatique via le webhook
```

---

## ⚠️ DÉPANNAGE

### Problème : Les emails ne partent pas

**Vérifiez :**
1. Extension `pg_net` activée dans Supabase
2. Logs dans **Database** > **Logs**
3. Variables d'environnement SMTP dans `.env`
4. Test manuel : `curl -X POST https://laboutiquedemorgane.com/api/emails/welcome -d '{"to":"test@example.com","data":{"firstName":"Test"}}'`

### Problème : Email reçu mais pas formaté

**Vérifiez :**
- Les composants React Email dans `components/emails/`
- La fonction `render()` dans `lib/email-sender.ts`

---

## 📞 SUPPORT

Si vous avez besoin d'aide :
1. Vérifiez les logs Supabase (**Database** > **Logs**)
2. Vérifiez les logs Vercel/Netlify
3. Testez manuellement avec curl/Postman

**Tout est prêt, il ne reste qu'à activer les triggers ! 🚀**
