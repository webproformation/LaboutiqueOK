# Guide de Conversion des Images WordPress vers Supabase Storage

## Vue d'ensemble

Ce guide explique comment utiliser le script de conversion automatique des URLs d'images WordPress vers Supabase Storage pour votre boutique en ligne.

---

## Projet : qcqbtmv (La Boutique de Morgane)

**URL Supabase** : `https://qcqbtmvbvipsxwjlgjvk.supabase.co`
**Données actuelles** :
- ✅ 122 produits (IDs en TEXT)
- ✅ 68 catégories
- ✅ 572 relations produits-catégories

---

## Qu'est-ce que fait le script ?

Le script `convert-wordpress-images-to-storage.js` :

1. **Parcourt tous les produits** et catégories de votre base de données
2. **Identifie les URLs WordPress** (ex: `https://wp.laboutiquedemorgane.com/wp-content/uploads/...`)
3. **Les convertit** en URLs Supabase Storage (ex: `https://qcqbtmvbvipsxwjlgjvk.supabase.co/storage/v1/object/public/product-images/products/image.jpg`)
4. **Met à jour la base de données** avec les nouvelles URLs

**⚠️ AUCUNE DONNÉE N'EST SUPPRIMÉE** - Le script ne fait que convertir les URLs.

---

## Buckets Supabase Storage

Le script utilise deux buckets :

1. **`product-images`** → Images des produits
   - Sous-dossier : `products/`

2. **`category-images`** → Images des catégories
   - Sous-dossier : `categories/`

---

## Utilisation du script

### 1. Vérifier les prérequis

```bash
# Le fichier .env doit pointer sur le bon projet
cat .env | grep SUPABASE_URL
# Doit afficher : https://qcqbtmvbvipsxwjlgjvk.supabase.co
```

### 2. Exécuter le script

```bash
cd /tmp/cc-agent/62170990/project
node scripts/convert-wordpress-images-to-storage.js
```

### 3. Vérifier les résultats

Le script affiche :
- ✅ Nombre de produits/catégories convertis
- ❌ Nombre d'erreurs
- 📊 Résumé complet

---

## Exemple de conversion

### Avant (WordPress)
```
https://wp.laboutiquedemorgane.com/wp-content/uploads/2024/01/robe-fleurie-123.jpg
```

### Après (Supabase Storage)
```
https://qcqbtmvbvipsxwjlgjvk.supabase.co/storage/v1/object/public/product-images/products/robe-fleurie-123.jpg
```

---

## Que faire si le script rencontre des erreurs ?

1. **Vérifier la connexion** à Supabase
2. **Vérifier que les buckets existent** :
   - Aller dans Supabase Dashboard → Storage
   - Vérifier `product-images` et `category-images`
3. **Vérifier les permissions** des buckets (doivent être publics)
4. **Relancer le script** - il ne modifiera que les URLs non encore converties

---

## Sécurité

- ✅ Le script est **verrouillé** sur le projet qcqbtmv
- ✅ **AUCUNE commande destructive** (pas de TRUNCATE, DELETE, DROP)
- ✅ Les IDs produits restent en **TEXT** (format WordPress)
- ✅ Les 122 produits et 572 relations sont **préservés**

---

## Questions fréquentes

### Q: Les images WordPress seront-elles supprimées ?
**R:** Non, le script ne touche pas aux fichiers sur WordPress, il convertit uniquement les URLs dans la base de données.

### Q: Que se passe-t-il si une image n'existe pas encore dans Supabase Storage ?
**R:** Le script convertit l'URL quand même. Vous devrez ensuite uploader les images manuellement dans les bons buckets.

### Q: Puis-je relancer le script plusieurs fois ?
**R:** Oui, le script est idempotent. Il ne convertira que les URLs qui pointent encore vers WordPress.

### Q: Comment uploader les images dans Supabase Storage ?
**R:** Vous pouvez utiliser :
1. Le dashboard Supabase (Storage → Upload)
2. Un script d'upload automatique (à créer si besoin)
3. L'API Supabase Storage

---

## Contact

En cas de problème, vérifiez :
1. Le fichier `.env` (doit pointer sur qcqbtmv)
2. Le fichier `lib/supabase.ts` (credentials hardcodées)
3. Les logs du script pour identifier les erreurs

---

**Dernière mise à jour** : 5 janvier 2026
**Projet** : qcqbtmvbvipsxwjlgjvk (La Boutique de Morgane)
