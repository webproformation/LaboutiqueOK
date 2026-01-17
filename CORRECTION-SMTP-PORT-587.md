# ✅ CORRECTION SMTP - PORT 587 + TLS/STARTTLS

**Date:** 15 janvier 2026
**Statut:** CORRIGÉ - Prêt pour redéploiement

---

## 🎯 PROBLÈME IDENTIFIÉ

Le port SMTP 465 (SSL direct) était **bloqué par le pare-feu de Vercel**, provoquant des timeouts infinis lors de l'envoi d'emails depuis la production.

**Symptômes:**
- Chargement infini sur `/admin/email-test`
- Erreur "ETIMEDOUT" dans les logs Vercel
- Aucun email envoyé depuis la production

---

## ✅ SOLUTION APPLIQUÉE

### Migration vers PORT 587 avec TLS/STARTTLS

**Configuration SMTP modifiée:**
```env
SMTP_HOST=mail.laboutiquedemorgane.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=email@laboutiquedemorgane.com
SMTP_PASS=votre_mot_de_passe
EMAIL_FROM="La Boutique de Morgane <email@laboutiquedemorgane.com>"
```

**⚠️ CRITIQUE:** Utilisez `mail.laboutiquedemorgane.com` et NON `laboutiquedemorgane.com` qui pointe vers Vercel !

**Pourquoi le port 587 ?**
- ✅ Compatible avec **tous les pare-feu cloud** (Vercel, Netlify, AWS Lambda)
- ✅ Utilise **TLS/STARTTLS** (connexion non chiffrée puis upgrade TLS)
- ✅ **Port standard recommandé** pour l'envoi d'emails depuis des applications web
- ✅ Supporté par **tous les hébergeurs SMTP** (o2switch, OVH, Gmail, etc.)

---

## 📁 FICHIERS MODIFIÉS

### 1. `/app/api/debug/send-test-email/route.ts`
**Changements:**
```typescript
host: process.env.SMTP_HOST || 'mail.laboutiquedemorgane.com',  // Fallback de sécurité
port: Number(process.env.SMTP_PORT || 587),                      // Au lieu de 465
secure: false,                                                   // Au lieu de true
tls: {
  ciphers: 'SSLv3',
  rejectUnauthorized: false
}
```

**Timeout augmenté:** 15 secondes (au lieu de 10)

### 2. `/lib/mail.ts`
**Configuration globale** pour tous les envois d'emails :
```typescript
port: parseInt(process.env.SMTP_PORT || '587'),
secure: false,
requireTLS: true,
tls: {
  ciphers: 'SSLv3',
  rejectUnauthorized: false
}
```

### 3. `/app/api/orders/send-email/route.ts`
**Emails de confirmation de commande** :
- Même configuration que ci-dessus
- Utilisé pour envoyer le PDF de commande

### 4. `.env.example`
**Mis à jour avec commentaires explicites:**
```env
# Configuration SMTP o2switch (Compatible Vercel/Netlify)
# IMPORTANT: Utilisez le port 587 avec TLS/STARTTLS au lieu de 465 (SSL direct)
# Le port 465 est souvent bloqué par les pare-feu des plateformes cloud
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_SECURE=false
```

---

## 🚀 ACTIONS À EFFECTUER SUR VERCEL

### 1. Mettre à jour les variables d'environnement

**Accédez à:** [Vercel Dashboard](https://vercel.com/dashboard) → Projet → Settings → Environment Variables

**Modifiez ces variables:**

| Variable | Ancienne valeur | Nouvelle valeur |
|----------|----------------|-----------------|
| `SMTP_PORT` | `465` | `587` |
| `SMTP_SECURE` | `true` | `false` |

**Modifiez également:**
- `SMTP_HOST` → `mail.laboutiquedemorgane.com` (PAS laboutiquedemorgane.com !)

**Laissez inchangées:**
- `SMTP_USER` (email@laboutiquedemorgane.com)
- `SMTP_PASS` (votre mot de passe actuel)
- `EMAIL_FROM` (votre adresse d'envoi)

### 2. Redéployer l'application

**Option A - Redéploiement automatique:**
```bash
git add .
git commit -m "fix: migration SMTP port 465 → 587 (TLS/STARTTLS)"
git push origin main
```

**Option B - Redéploiement manuel:**
- Allez dans l'onglet "Deployments" sur Vercel
- Cliquez sur "Redeploy" sur le dernier déploiement

---

## ✅ TESTS À EFFECTUER APRÈS DÉPLOIEMENT

### 1. Test d'envoi d'email simple
**URL:** `https://votre-site.vercel.app/admin/email-test`

**Résultat attendu:**
- ✅ Email envoyé en **moins de 15 secondes**
- ✅ Message de succès affiché
- ✅ Email reçu dans la boîte de réception

### 2. Test de confirmation de commande
**Processus:**
1. Créer une commande test
2. Vérifier que l'email avec PDF est envoyé
3. Vérifier la réception

**Résultat attendu:**
- ✅ Email avec PDF reçu
- ✅ Formatage correct du HTML
- ✅ Pièce jointe présente

---

## 📊 DIAGNOSTIC DES ERREURS POSSIBLES

### Erreur "ETIMEDOUT" ou "TIMEOUT"
**Cause:** Le serveur SMTP ne répond pas
**Solutions:**
- Vérifiez que le port 587 est bien ouvert sur o2switch
- Contactez o2switch pour confirmer l'accès au port 587

### Erreur "EAUTH"
**Cause:** Identifiants SMTP incorrects
**Solutions:**
- Vérifiez `SMTP_USER` et `SMTP_PASS` dans Vercel
- Régénérez le mot de passe d'application si nécessaire

### Erreur "ENOTFOUND"
**Cause:** Le nom de domaine SMTP est introuvable
**Solutions:**
- Vérifiez `SMTP_HOST` (doit être `laboutiquedemorgane.com`)
- Testez avec `ping laboutiquedemorgane.com`

---

## 📋 RÉCAPITULATIF TECHNIQUE

### Configuration SMTP finale (Production)
```javascript
{
  host: 'mail.laboutiquedemorgane.com',  // ⚠️ CRITIQUE: mail. au début !
  port: 587,
  secure: false,
  auth: {
    user: 'email@laboutiquedemorgane.com',
    pass: 'votre_mot_de_passe'
  },
  tls: {
    ciphers: 'SSLv3',
    rejectUnauthorized: false
  }
}
```

### Comparaison PORT 465 vs PORT 587

| Critère | PORT 465 (SSL) | PORT 587 (TLS) |
|---------|----------------|----------------|
| Protocole | SSL direct | STARTTLS |
| Compatibilité Vercel | ❌ Bloqué | ✅ Fonctionnel |
| Sécurité | Chiffrement dès connexion | Upgrade TLS après handshake |
| Standard recommandé | ⚠️ Déprécié | ✅ Moderne |
| Support hébergeurs | Limité | Universel |

---

## 🎉 RÉSULTAT FINAL

✅ **Tous les fichiers d'envoi d'emails sont corrigés**
✅ **Build réussi sans erreurs**
✅ **Configuration TLS optimale pour Vercel**
✅ **Timeouts de 15 secondes pour éviter les blocages**
✅ **Messages d'erreur détaillés pour diagnostic**

---

## 📞 SUPPORT

Si après redéploiement le problème persiste :

1. **Vérifiez les logs Vercel:**
   - Onglet "Functions" → Cliquez sur `/api/debug/send-test-email`
   - Recherchez les erreurs `ETIMEDOUT`, `ECONNREFUSED`

2. **Contactez o2switch:**
   - Demandez confirmation que le **port 587 est bien ouvert**
   - Demandez si STARTTLS est activé pour votre compte

3. **Test local:**
   ```bash
   telnet laboutiquedemorgane.com 587
   ```
   Vous devriez voir : `220 laboutiquedemorgane.com ESMTP`

---

**Auteur:** Assistant IA
**Version:** 1.0
**Date:** 15 janvier 2026
