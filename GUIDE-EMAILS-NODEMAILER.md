# 📧 Guide Système d'E-mails avec Nodemailer & React Email

## ✅ MIGRATION COMPLÈTE : Resend → Nodemailer

Le système d'e-mails utilise maintenant **Nodemailer** avec votre serveur SMTP o2switch au lieu de Resend.

---

## 📚 ARCHITECTURE

### **Fichiers Créés/Modifiés**

```
lib/
  ├── email.ts                    # ✅ Transporter Nodemailer configuré
  └── email-sender.ts             # ✅ Fonctions d'envoi migrées

components/emails/
  ├── EmailLayout.tsx             # Layout commun avec header/footer
  ├── WelcomeEmail.tsx            # 1. Bienvenue
  ├── OrderConfirmationEmail.tsx  # 2. Confirmation commande
  ├── OpenPackageStartEmail.tsx   # 3. Start colis ouvert
  ├── OpenPackageAddEmail.tsx     # 4. Ajout colis
  ├── ShippingEmail.tsx           # 5. Expédition
  ├── ClickAndCollectEmail.tsx    # 6. Click & Collect prêt
  ├── AbandonedCartEmail.tsx      # 7. Panier abandonné (CRON)
  ├── PackageClosingWarningEmail.tsx  # 8. Alerte fin colis (CRON)
  ├── ReviewRequestEmail.tsx      # 9. Demande d'avis (CRON)
  ├── PasswordResetEmail.tsx      # 10. Reset password
  └── DiamondFoundEmail.tsx       # 11. Diamant trouvé

app/api/emails/
  ├── welcome/route.ts            # API Bienvenue
  ├── order-confirmation/route.ts # API Confirmation
  ├── shipping/route.ts           # API Expédition
  ├── open-package/route.ts       # API Colis ouvert
  └── diamond/route.ts            # API Diamant

app/api/cron/
  ├── abandoned-cart/route.ts     # CRON Paniers >2h
  ├── package-warning/route.ts    # CRON J-1 fermeture
  └── review-request/route.ts     # CRON J+7 expédition
```

---

## ⚙️ CONFIGURATION SMTP

### **Variables d'environnement requises (.env)**

```env
# SMTP o2switch (OBLIGATOIRE)
SMTP_HOST=mail.laboutiquedemorgane.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@laboutiqudemorgane.fr
SMTP_PASS=votre_mot_de_passe_smtp
EMAIL_FROM="La Boutique de Morgane <noreply@laboutiqudemorgane.fr>"

# Sécurité CRON
CRON_SECRET=un_secret_fort_aleatoire_pour_cron
```

### **⚠️ IMPORTANT : Port SMTP**

- **Utilisez le port 587** (STARTTLS) - Compatible Vercel/Netlify
- **NE PAS utiliser le port 465** (SSL direct) - Bloqué par les pare-feu cloud

---

## 🔧 TRANSPORTER NODEMAILER

**`lib/email.ts`**

```typescript
import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false, // true pour 465, false pour 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const FROM_EMAIL = process.env.EMAIL_FROM || 'La Boutique de Morgane <noreply@laboutiqudemorgane.fr>';
```

---

## 📨 UTILISATION DES FONCTIONS D'ENVOI

### **1. E-mail de Bienvenue (Création compte)**

```typescript
import { sendWelcomeEmail } from '@/lib/email-sender';

// Dans votre route d'inscription
await sendWelcomeEmail(user.email, user.first_name);
```

### **2. Confirmation de Commande**

```typescript
// Via API route (recommandé)
await fetch('/api/emails/order-confirmation', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ orderId: order.id })
});
```

### **3. Colis Ouvert (Start)**

```typescript
await fetch('/api/emails/open-package', {
  method: 'POST',
  body: JSON.stringify({
    packageId: pkg.id,
    orderId: order.id,
    type: 'start' // ou 'add' pour ajout
  })
});
```

### **4. Expédition (Avec tracking)**

```typescript
await fetch('/api/emails/shipping', {
  method: 'POST',
  body: JSON.stringify({
    orderId: order.id,
    trackingNumber: 'FR123456789',
    trackingUrl: 'https://track.laposte.fr/...'
  })
});
```

### **5. Diamant Trouvé (Jeu)**

```typescript
import { sendDiamondFoundEmail } from '@/lib/email-sender';

await sendDiamondFoundEmail(user.email, user.first_name, 0.20);
```

---

## ⏰ CONFIGURATION DES CRON

Les 3 routes CRON sont **sécurisées par Bearer token**.

### **1. Panier Abandonné** (Toutes les 2h)

```bash
POST https://laboutiqudemorgane.fr/api/cron/abandoned-cart
Authorization: Bearer VOTRE_CRON_SECRET
```

**Logique :**
- Recherche les paniers >2h sans commande
- Vérifie `profiles.abandoned_cart_email_sent = false`
- Envoie l'e-mail et marque la colonne à `true`

### **2. Alerte Fin de Colis** (1x/jour à 10h)

```bash
POST https://laboutiqudemorgane.fr/api/cron/package-warning
Authorization: Bearer VOTRE_CRON_SECRET
```

**Logique :**
- Recherche les `open_packages` qui ferment dans 24h
- Vérifie `warning_email_sent = false`
- Envoie l'e-mail et marque la colonne à `true`

### **3. Demande d'Avis** (1x/jour à 14h)

```bash
POST https://laboutiqudemorgane.fr/api/cron/review-request
Authorization: Bearer VOTRE_CRON_SECRET
```

**Logique :**
- Recherche les commandes `status = 'shipped'` depuis 7 jours
- Vérifie `review_email_sent = false`
- Envoie l'e-mail et marque la colonne à `true`

### **Services CRON recommandés**

- [cron-job.org](https://cron-job.org) (Gratuit)
- [EasyCron](https://easycron.com) (Gratuit)
- [Vercel Cron](https://vercel.com/docs/cron-jobs) (Intégré, payant)

---

## 🗄️ BASE DE DONNÉES (Migration appliquée)

### **Colonnes de tracking ajoutées**

```sql
-- Profiles
profiles.abandoned_cart_email_sent (boolean, default false)

-- Open Packages
open_packages.warning_email_sent (boolean, default false)

-- Orders
orders.review_email_sent (boolean, default false)
orders.shipped_at (timestamptz, nullable)
```

**Ces colonnes évitent l'envoi multiple du même e-mail.**

---

## 🎨 DESIGN DES E-MAILS

### **Layout Global (EmailLayout.tsx)**

- **Header :** Logo `lbdm-logobdc.png` centré sur fond noir
- **Footer :** Mentions légales, contacts (Doudou/Morgane), réseaux sociaux, lien de désabonnement
- **Couleurs :** Or (#D4AF37) / Noir / Blanc
- **Ton :** Chaleureux, tutoiement, emojis

### **Templates React Email**

Chaque template utilise :
- `@react-email/components` (Heading, Text, Button, Section, etc.)
- Styles inline CSS-in-JS
- Variables dynamiques (prénom, numéro de commande, etc.)

---

## 🚀 DÉPLOIEMENT

### **Vercel/Netlify**

1. Ajoutez les variables d'environnement dans le dashboard
2. Déployez normalement
3. Configurez les CRON externes (Vercel n'exécute pas de CRON gratuit)

### **VPS/Serveur dédié**

1. Configurez les variables dans `.env`
2. Utilisez `systemd` ou `crontab` pour les tâches planifiées

---

## 🔒 SÉCURITÉ

### **Côté Serveur UNIQUEMENT**

- **JAMAIS** d'appel à `sendMail()` côté client
- Toutes les fonctions sont dans des **API Routes** (`/app/api`)
- Les CRON sont protégés par **Bearer token**

### **Protection CRON**

```typescript
const authHeader = request.headers.get('authorization');
const providedSecret = authHeader?.replace('Bearer ', '');

if (providedSecret !== CRON_SECRET) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

---

## 📝 EXEMPLE D'INTÉGRATION COMPLÈTE

### **Inscription utilisateur**

```typescript
// app/api/auth/signup/route.ts
import { sendWelcomeEmail } from '@/lib/email-sender';

export async function POST(request: Request) {
  const { email, firstName, password } = await request.json();

  // Créer l'utilisateur
  const user = await createUser(email, password);

  // Envoyer l'e-mail de bienvenue
  await sendWelcomeEmail(email, firstName);

  return NextResponse.json({ success: true });
}
```

### **Commande validée**

```typescript
// app/api/orders/create/route.ts
export async function POST(request: Request) {
  const order = await createOrder(...);

  // Envoyer confirmation
  await fetch('/api/emails/order-confirmation', {
    method: 'POST',
    body: JSON.stringify({ orderId: order.id })
  });

  return NextResponse.json({ orderId: order.id });
}
```

---

## ✅ CHECKLIST FINALE

- [x] Nodemailer installé et configuré
- [x] 11 templates React Email créés
- [x] 8 API routes d'envoi créées
- [x] 3 CRON sécurisés
- [x] Migration SQL appliquée
- [x] Variables .env.example documentées
- [x] Build TypeScript sans erreurs

---

## 🆘 DÉPANNAGE

### **E-mails non envoyés**

1. Vérifiez les logs serveur (`console.error`)
2. Testez les identifiants SMTP manuellement
3. Vérifiez que le port 587 n'est pas bloqué

### **CRON ne s'exécute pas**

1. Vérifiez le `CRON_SECRET` dans l'en-tête `Authorization`
2. Vérifiez les logs du service CRON externe
3. Testez manuellement avec `curl` :

```bash
curl -X POST https://laboutiqudemorgane.fr/api/cron/abandoned-cart \
  -H "Authorization: Bearer VOTRE_SECRET"
```

### **Templates mal rendus**

1. Les templates sont générés côté serveur uniquement
2. Vérifiez que `@react-email/render` fonctionne
3. Testez le rendu HTML en console :

```typescript
const html = await render(WelcomeEmail({ firstName: 'Test' }));
console.log(html);
```

---

**Système opérationnel et prêt pour la production ! 🎉**
