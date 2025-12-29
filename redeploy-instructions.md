# Redéploiement avec cache nettoyé

## Option 1 : Via le Dashboard Vercel
1. Allez sur https://vercel.com
2. Sélectionnez votre projet
3. Onglet "Deployments"
4. Cliquez sur "..." du dernier déploiement
5. "Redeploy"
6. DÉCOCHEZ "Use existing Build Cache"
7. Cliquez "Redeploy"

## Option 2 : Via Git (recommandé)
```bash
git add .
git commit -m "fix: force rebuild"
git push
```

Les erreurs 400 disparaîtront après le redéploiement.
