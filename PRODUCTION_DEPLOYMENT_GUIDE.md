# 🚀 GUIDE DE DÉPLOIEMENT EN PRODUCTION

## 🚨 PROBLÈME ACTUEL

Le site est en production sur Vercel mais utilise encore l'ancienne instance Supabase `hondlefoprhtrpxnumyj` au lieu de `ftgclacfleknkqbfbsbs`.

## ✅ SOLUTION : Mettre à jour les variables d'environnement sur Vercel

### Étape 1 : Accéder aux variables d'environnement Vercel

1. Allez sur [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. Sélectionnez votre projet "laboutiquedemorgane"
3. Cliquez sur **Settings** dans le menu du haut
4. Cliquez sur **Environment Variables** dans le menu de gauche

### Étape 2 : Mettre à jour les 3 variables critiques

Vous devez modifier ces 3 variables (cliquez sur le crayon à côté de chaque variable) :

#### 1. NEXT_PUBLIC_SUPABASE_URL
**Ancienne valeur** : `https://hondlefoprhtrpxnumyj.supabase.co`
**Nouvelle valeur** :
```
https://ftgclacfleknkqbfbsbs.supabase.co
```

#### 2. NEXT_PUBLIC_SUPABASE_ANON_KEY
**Ancienne valeur** : clé contenant `hondlefoprhtrpxnumyj`
**Nouvelle valeur** :
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0Z2NsYWNmbGVrbmtxYmZic2JzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwMzA3NjUsImV4cCI6MjA4MDYwNjc2NX0.fZ_yi8opM3kQ4T-hCagMebTvM7spx7tIMZvaTBPBSe8
```

#### 3. SUPABASE_SERVICE_ROLE_KEY
**Ancienne valeur** : clé contenant `hondlefoprhtrpxnumyj`
**Nouvelle valeur** :
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0Z2NsYWNmbGVrbmtxYmZic2JzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTAzMDc2NSwiZXhwIjoyMDgwNjA2NzY1fQ.rpp3Na0D87yoXCTy5P0rNG4B3-n7LkPVyAh-yheoe6E
```

### Étape 3 : Sélectionner les environnements

Pour chaque variable, assurez-vous que ces cases sont cochées :
- ✅ Production
- ✅ Preview
- ✅ Development

### Étape 4 : Redéployer l'application

**IMPORTANT** : Les changements de variables ne sont pas automatiquement appliqués. Vous devez redéployer.

#### Option A : Via l'interface Vercel (RECOMMANDÉ)

1. Allez dans l'onglet **Deployments**
2. Trouvez le dernier déploiement réussi
3. Cliquez sur les 3 points (...) à droite
4. Cliquez sur **Redeploy**
5. Assurez-vous que "Use existing Build Cache" est **DÉCOCHÉ** ❌
6. Cliquez sur **Redeploy**

#### Option B : Via Git (Alternative)

```bash
git commit --allow-empty -m "chore: trigger redeploy with new env vars"
git push
```

### Étape 5 : Vérifier que tout fonctionne

Une fois le déploiement terminé (environ 2-3 minutes) :

1. **Videz le cache de votre navigateur** avec un hard refresh :
   - Windows/Linux : `Ctrl + Shift + R`
   - Mac : `Cmd + Shift + R`

2. **Testez l'API de debug** :
   Allez sur : `https://laboutiquedemorgane.com/api/debug-env`

   Vous devriez voir :
   ```json
   {
     "verdict": "✅ TOUTES LES VARIABLES SONT CORRECTES"
   }
   ```

3. **Vérifiez la console du navigateur** (F12) :
   - ✅ Aucune requête vers `hondlefoprhtrpxnumyj.supabase.co`
   - ✅ Toutes les requêtes vont vers `ftgclacfleknkqbfbsbs.supabase.co`
   - ✅ `/api/invoices` retourne 200 au lieu de 500

## 🔍 DIAGNOSTIC EN CAS DE PROBLÈME

### Si l'API debug-env montre encore l'ancien instance :

1. Vérifiez que vous avez bien SAUVEGARDÉ les variables sur Vercel
2. Vérifiez que vous avez REDÉPLOYÉ (pas juste sauvegardé les variables)
3. Attendez 2-3 minutes que le déploiement soit terminé
4. Videz le cache navigateur et réessayez

### Si vous voyez toujours des erreurs 500 :

1. Allez dans **Deployments** > **Functions**
2. Cliquez sur l'erreur pour voir les logs
3. Les logs vous diront exactement quel est le problème

## 📱 API de Debug Disponibles

Après le déploiement, ces URLs sont disponibles pour le diagnostic :

- **Variables d'environnement** : `/api/debug-env`
- **Utilisateurs Supabase** : `/api/supabase/users`
- **Test des secrets** : Voir les logs Vercel

## ⚡ COMMANDES RAPIDES

```bash
# Pour déclencher un nouveau déploiement
git commit --allow-empty -m "chore: redeploy" && git push

# Pour vérifier l'environnement local
node verify-env.js
```

## 📋 CHECKLIST DE VÉRIFICATION

Avant de considérer que c'est terminé, vérifiez :

- [ ] Les 3 variables sont mises à jour sur Vercel
- [ ] Les 3 environnements (Production, Preview, Development) sont cochés
- [ ] L'application a été redéployée
- [ ] `/api/debug-env` affiche le verdict ✅
- [ ] Aucune erreur 500 sur `/api/invoices`
- [ ] Aucune requête vers `hondlefoprhtrpxnumyj` dans la console
- [ ] Le site fonctionne normalement

---

**Date** : 2024-12-28
**Environnement** : Production (Vercel)
**Urgence** : 🔴 CRITIQUE
