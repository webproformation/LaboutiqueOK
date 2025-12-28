# Déploiement Vercel - Étapes Rapides

## 🎯 Action Immédiate

### ÉTAPE 1 : Supprimer l'ancien domaine Vercel (MAINTENANT)

1. **https://vercel.com/dashboard**
2. Cliquez sur votre projet
3. **Settings** → **Domains**
4. Supprimez `laboutiquedemorgane.com` et `www.laboutiquedemorgane.com`

⏰ **Attendez 5 minutes** que Vercel libère les domaines.

---

## 📋 Checklist Complète

### ✅ ÉTAPE 2 : Préparer le code

```bash
cd /tmp/cc-agent/61087157/project

# Build pour vérifier (déjà fait ✓)
npm run build

# Git
git init
git add .
git commit -m "Ready for Vercel"
```

### ✅ ÉTAPE 3 : GitHub

1. Créez un repo sur **https://github.com/new**
2. Nom : `laboutiquedemorgane`
3. **Private**
4. **Create repository**

```bash
git remote add origin https://github.com/VOTRE_USERNAME/laboutiquedemorgane.git
git branch -M main
git push -u origin main
```

### ✅ ÉTAPE 4 : Déployer sur Vercel

1. **https://vercel.com/new**
2. **Import** votre repo GitHub
3. **IMPORTANT** : Avant de cliquer Deploy, ajoutez les variables d'environnement

#### Variables d'environnement à copier :

Regardez votre fichier `.env` et copiez TOUTES ces variables dans Vercel :

```env
NEXT_PUBLIC_WORDPRESS_API_URL=https://wp.laboutiquedemorgane.com/wp-json
WORDPRESS_API_URL=https://wp.laboutiquedemorgane.com/wp-json
WOOCOMMERCE_URL=https://wp.laboutiquedemorgane.com
WOOCOMMERCE_CONSUMER_KEY=ck_...
WOOCOMMERCE_CONSUMER_SECRET=cs_...
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

**+ TOUTES les autres variables de votre .env**

4. Cliquez **Deploy**
5. Attendez 5-10 minutes

### ✅ ÉTAPE 5 : Ajouter le domaine

1. Vercel Dashboard → **Settings** → **Domains**
2. Ajoutez : `laboutiquedemorgane.com`
3. Ajoutez : `www.laboutiquedemorgane.com`
4. Notez les instructions DNS que Vercel vous donne

### ✅ ÉTAPE 6 : Configurer le DNS

Chez votre registrar de domaine (OVH, Gandi, etc.) :

**Supprimez** les anciens A records pour `@` et `www`

**Ajoutez** :
```
Type    Nom    Valeur                  TTL
A       @      76.76.21.21            300
CNAME   www    cname.vercel-dns.com   300
```

**Gardez** :
```
A       wp     109.234.166.44         300
```

### ✅ ÉTAPE 7 : Attendre et vérifier

⏰ Attendez 10-30 minutes pour la propagation DNS

Testez : **https://laboutiquedemorgane.com**

---

## 🚀 Script Automatique

Vous pouvez utiliser ce script pour automatiser les étapes 2-3 :

```bash
bash deploy-vercel.sh
```

---

## 📖 Guides Complets

- **Guide détaillé** : `GUIDE_DEPLOIEMENT_VERCEL_ETAPES.md`
- **Architecture complète** : `MIGRATION_O2SWITCH.md`

---

## ❓ Besoin d'aide ?

1. **Vercel ne build pas** → Vérifiez les variables d'environnement
2. **Domaine ne pointe pas** → Vérifiez le DNS (attendre 30 min)
3. **Produits ne chargent pas** → Vérifiez les clés API WooCommerce
4. **Erreur 500** → Regardez les logs dans Vercel Dashboard → Functions

---

## 🎉 Une fois terminé

Votre architecture sera :

```
Frontend (Next.js) → Vercel
Backend (WordPress) → o2switch
Database (Supabase) → Supabase Cloud
```

Performances optimales, coûts minimaux, scalabilité maximale !
