# 🚨 ACTIONS URGENTES - SITE EN PRODUCTION

## LE PROBLÈME

Votre site en production utilise encore l'ancienne base de données Supabase `hondlefoprhtrpxnumyj` alors qu'il devrait utiliser `ftgclacfleknkqbfbsbs`.

## LA SOLUTION (5 MINUTES)

### 1️⃣ Aller sur Vercel
👉 [https://vercel.com/dashboard](https://vercel.com/dashboard)

### 2️⃣ Modifier les variables d'environnement

1. Sélectionner votre projet
2. **Settings** → **Environment Variables**
3. Modifier ces 3 variables :

```bash
NEXT_PUBLIC_SUPABASE_URL=https://ftgclacfleknkqbfbsbs.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0Z2NsYWNmbGVrbmtxYmZic2JzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwMzA3NjUsImV4cCI6MjA4MDYwNjc2NX0.fZ_yi8opM3kQ4T-hCagMebTvM7spx7tIMZvaTBPBSe8

SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0Z2NsYWNmbGVrbmtxYmZic2JzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTAzMDc2NSwiZXhwIjoyMDgwNjA2NzY1fQ.rpp3Na0D87yoXCTy5P0rNG4B3-n7LkPVyAh-yheoe6E
```

⚠️ Cocher **Production**, **Preview**, **Development** pour chaque variable

### 3️⃣ Redéployer

1. **Deployments** → Dernier déploiement
2. **...** → **Redeploy**
3. ❌ **DÉCOCHER** "Use existing Build Cache"
4. Cliquer **Redeploy**

### 4️⃣ Attendre 2-3 minutes

Le déploiement prend quelques minutes.

### 5️⃣ Vérifier

1. Vider le cache navigateur : `Ctrl + Shift + R` (Windows) ou `Cmd + Shift + R` (Mac)
2. Aller sur : `https://laboutiquedemorgane.com/api/debug-env`
3. Vérifier que le verdict est : **"✅ TOUTES LES VARIABLES SONT CORRECTES"**

## 📋 VÉRIFICATIONS FINALES

- [ ] Variables mises à jour sur Vercel
- [ ] Application redéployée
- [ ] Cache navigateur vidé
- [ ] `/api/debug-env` affiche ✅
- [ ] Plus d'erreur 500 sur `/api/invoices`

## 📚 GUIDE DÉTAILLÉ

Voir `PRODUCTION_DEPLOYMENT_GUIDE.md` pour les instructions complètes.

---

**URGENT** - À faire maintenant pour que le site fonctionne correctement en production.
