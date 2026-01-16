# 🚀 INSTRUCTIONS URGENTES POUR VERCEL

**Date:** 15 janvier 2026
**Priorité:** CRITIQUE
**Temps estimé:** 2 minutes

---

## ⚠️ CHANGEMENTS OBLIGATOIRES SUR VERCEL

### 1. Variables d'environnement à modifier

Connectez-vous à Vercel → Projet → **Settings** → **Environment Variables**

| Variable | ❌ Ancienne valeur | ✅ Nouvelle valeur |
|----------|-------------------|-------------------|
| `SMTP_HOST` | `laboutiquedemorgane.com` | `mail.laboutiquedemorgane.com` |
| `SMTP_PORT` | `465` | `587` |
| `SMTP_SECURE` | `true` ou vide | `false` |

**Laissez inchangées** :
- `SMTP_USER`
- `SMTP_PASS`
- `EMAIL_FROM`

---

## 📋 POURQUOI CES CHANGEMENTS ?

### Problème 1 : Mauvais serveur SMTP
- ❌ `laboutiquedemorgane.com` → Pointe vers **Vercel** (pas de serveur mail)
- ✅ `mail.laboutiquedemorgane.com` → Pointe vers **o2switch** (serveur mail)

### Problème 2 : Port bloqué
- ❌ Port `465` (SSL direct) → **Bloqué par Vercel**
- ✅ Port `587` (TLS/STARTTLS) → **Autorisé par Vercel**

---

## ✅ APRÈS MODIFICATION DES VARIABLES

### Redéploiement automatique

Le code a déjà été pushé avec les fallbacks de sécurité :
```typescript
host: process.env.SMTP_HOST || 'mail.laboutiquedemorgane.com'
port: process.env.SMTP_PORT || 587
```

Donc après modification des variables d'environnement :

1. **Cliquez sur "Deployments"** dans Vercel
2. **Redeploy** le dernier déploiement
3. Attendez 2-3 minutes

---

## 🧪 TEST APRÈS DÉPLOIEMENT

### Test d'envoi simple
```
URL: https://votre-site.vercel.app/admin/email-test
```

**Résultat attendu** :
- ✅ Email envoyé en **moins de 5 secondes**
- ✅ Message "Email envoyé avec succès"
- ✅ Email reçu dans la boîte

**Si erreur "TIMEOUT"** → Vérifiez `SMTP_HOST` (doit être `mail.laboutiquedemorgane.com`)

---

## 📞 DIAGNOSTIC RAPIDE

### Erreur "ENOTFOUND"
**Cause** : Le serveur SMTP n'existe pas
**Solution** : Vérifiez que `SMTP_HOST = mail.laboutiquedemorgane.com`

### Erreur "ETIMEDOUT"
**Cause** : Port bloqué ou mauvais serveur
**Solutions** :
1. Vérifiez `SMTP_PORT = 587`
2. Vérifiez `SMTP_HOST = mail.laboutiquedemorgane.com`

### Erreur "EAUTH"
**Cause** : Identifiants incorrects
**Solution** : Vérifiez `SMTP_USER` et `SMTP_PASS`

---

## ✅ CONFIGURATION FINALE (Copier-Coller)

```env
SMTP_HOST=mail.laboutiquedemorgane.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=email@laboutiquedemorgane.com
SMTP_PASS=votre_mot_de_passe_actuel
EMAIL_FROM="La Boutique de Morgane <email@laboutiquedemorgane.com>"
```

---

## 🎯 RÉCAPITULATIF 30 SECONDES

1. Vercel → Settings → Environment Variables
2. Changez `SMTP_HOST` → `mail.laboutiquedemorgane.com`
3. Changez `SMTP_PORT` → `587`
4. Ajoutez/Modifiez `SMTP_SECURE` → `false`
5. Sauvegardez et Redéployez
6. Testez `/admin/email-test`

**Temps total** : 2 minutes
**Difficulté** : Facile

---

**Auteur:** Assistant IA
**Version:** 2.0 (Correction HOST critique)
**Date:** 15 janvier 2026
