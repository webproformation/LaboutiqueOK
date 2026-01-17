# 📐 Guide Système user_size - Badges "Match" Personnalisés

**Projet :** qcqbtmvbvipsxwjlgjvk ✅
**Date :** 12 janvier 2026

---

## 🎯 OBJECTIF

Permettre aux utilisateurs de renseigner leur taille habituelle pour afficher automatiquement des badges **"C'est votre taille !"** sur les produits compatibles.

---

## 🏗️ ARCHITECTURE TECHNIQUE

### Base de données

#### 1. Table `profiles`
- **Nouvelle colonne** : `user_size` (INTEGER, nullable)
- Stocke la taille habituelle de l'utilisateur (ex: 38, 40, 42, 44...)
- Valeurs typiques : 34 à 54

#### 2. Table `product_variations`
- **Nouvelles colonnes** :
  - `size_min` (INTEGER, nullable) : Taille minimale compatible
  - `size_max` (INTEGER, nullable) : Taille maximale compatible
- Index créé pour optimiser les requêtes : `idx_product_variations_size_range`

**Exemple :**
```sql
-- Une robe taille 42 qui convient du 40 au 44
size_min = 40
size_max = 44

-- Si user_size = 42, le badge s'affichera car 42 est entre 40 et 44
```

#### 3. Table `customer_measurements`
- Stocke les mensurations détaillées (optionnelles)
- Colonnes : height, weight, bust, waist, hips, inseam, shoe_size, notes

---

## 💻 IMPLÉMENTATION FRONTEND

### Page `/account/measurements`

**Fichier :** `app/account/measurements/page.tsx`

**Fonctionnalités :**
- Formulaire de sélection de taille (34 à 54)
- Sauvegarde dans `profiles.user_size`
- Mensurations détaillées optionnelles dans `customer_measurements`
- Validation et gestion d'erreurs 400

**Flux de données :**
```javascript
1. L'utilisateur sélectionne sa taille (ex: 42)
2. Enregistrement via Supabase :
   - profiles.user_size = 42 (INTEGER)
   - customer_measurements.* (optionnel)
3. Badge "Match" apparaît automatiquement sur les produits compatibles
```

### Composant `ProductCard.tsx`

**Fichier :** `components/ProductCard.tsx`

**Logique du badge :**
```javascript
useEffect(() => {
  if (user && profile?.user_size && product.is_variable_product) {
    checkSizeCompatibility();
  }
}, [user, profile, product.id]);

const checkSizeCompatibility = async () => {
  const { data } = await supabase
    .from('product_variations')
    .select('size_min, size_max')
    .eq('product_id', product.id)
    .not('size_min', 'is', null)
    .not('size_max', 'is', null);

  const userSize = profile.user_size;
  const hasMatch = data?.some(
    (v) => userSize >= v.size_min && userSize <= v.size_max
  );

  setSizeMatch(hasMatch);
};
```

**Affichage du badge :**
```jsx
{sizeMatch && (
  <div className="absolute top-3 right-3 bg-gradient-to-r from-[#D4AF37] to-[#C6A15B] text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg">
    ✨ C'est votre taille !
  </div>
)}
```

---

## 📊 SCRIPT DE TEST

**Fichier :** `scripts/test-user-size-system.js`

**Exécution :**
```bash
node scripts/test-user-size-system.js
```

**Tests effectués :**
1. ✅ Vérification colonne `user_size` dans `profiles`
2. ✅ Vérification table `customer_measurements`
3. ✅ Vérification colonnes `size_min/size_max` dans `product_variations`
4. ✅ Simulation de correspondance de taille
5. ✅ Vérification type INTEGER

---

## 🚀 UTILISATION POUR L'UTILISATEUR FINAL

### Étape 1 : Se connecter
```
https://votre-site.com/auth/login
```

### Étape 2 : Accéder aux mensurations
```
https://votre-site.com/account/measurements
```

### Étape 3 : Choisir sa taille
- Sélectionner sa taille habituelle (ex: 42)
- Cliquer sur "Enregistrer mes mensurations"
- Confirmation de succès

### Étape 4 : Voir les badges
- Les produits compatibles affichent automatiquement ✨ **"C'est votre taille !"**
- Le badge apparaît uniquement sur les produits variables avec intervalles définis
- Mise à jour en temps réel lors de la navigation

---

## 🔧 CONFIGURATION PRODUITS (ADMIN)

### Pour qu'un produit affiche le badge

1. Le produit doit être **variable** (`is_variable_product = true`)
2. Les variations doivent avoir `size_min` et `size_max` définis

**Exemple SQL :**
```sql
-- Mise à jour manuelle pour une variation
UPDATE product_variations
SET size_min = 40, size_max = 44
WHERE id = 'variation-uuid';

-- Pour une robe taille 42 qui va du 40 au 44
```

**Via l'interface admin :**
- Aller dans `/admin/products/[id]`
- Section "Variations"
- Définir les intervalles de taille pour chaque variation

---

## ⚠️ POINTS IMPORTANTS

### Gestion du cache Supabase
Les colonnes `size_min` et `size_max` peuvent nécessiter un délai de **5-10 minutes** pour apparaître dans l'API Supabase côté client après la migration.

**Vérification directe en SQL :**
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'product_variations'
  AND column_name IN ('size_min', 'size_max');
```

### Format des données
- **user_size** : INTEGER (pas de STRING)
- **size_min/size_max** : INTEGER (pas de STRING)
- **user_id** : TEXT (format UUID ou WordPress ID)

### Sécurité
- RLS actif sur toutes les tables
- Les utilisateurs ne peuvent modifier que leur propre profil
- Validation côté serveur pour les valeurs de taille

---

## 🧪 VALIDATION FONCTIONNELLE

### Checklist de test

- [ ] Connexion utilisateur réussie
- [ ] Accès à `/account/measurements`
- [ ] Sélection et sauvegarde de taille (ex: 42)
- [ ] Absence d'erreur 400
- [ ] Badge "Match" visible sur produits compatibles
- [ ] Badge absent sur produits non compatibles
- [ ] Badge absent sur produits simples (non variables)

### Tests recommandés

1. **Test avec user_size = 42**
   - Créer une variation avec size_min=40, size_max=44
   - Badge doit apparaître ✅

2. **Test avec user_size = 38**
   - Même variation (40-44)
   - Badge ne doit PAS apparaître ❌

3. **Test sans size_min/size_max**
   - Variation sans intervalles définis
   - Badge ne doit PAS apparaître ❌

---

## 📈 PROCHAINES AMÉLIORATIONS POSSIBLES

1. **Recommandations automatiques** : Suggérer des produits selon la taille
2. **Notifications** : Alerter quand un produit en taille compatible arrive
3. **Historique** : Tracker l'évolution des mensurations
4. **Guide des tailles** : Calculer automatiquement size_min/size_max
5. **Statistiques admin** : Voir les tailles les plus demandées

---

## 🆘 DÉPANNAGE

### Erreur 400 lors de la sauvegarde
**Cause :** Colonne `user_size` manquante dans `profiles`
**Solution :** Migration déjà appliquée, vérifier le cache

### Badge ne s'affiche pas
**Causes possibles :**
1. L'utilisateur n'a pas défini sa taille → Aller sur `/account/measurements`
2. Le produit n'est pas variable → Normal, badge uniquement pour produits variables
3. Aucune variation n'a size_min/size_max → Configurer les intervalles en admin
4. Cache Supabase pas rafraîchi → Attendre 5-10 minutes

### Vérification SQL directe
```sql
-- Vérifier user_size d'un utilisateur
SELECT id, email, user_size
FROM profiles
WHERE email = 'user@example.com';

-- Vérifier les variations avec intervalles
SELECT id, product_id, size_min, size_max
FROM product_variations
WHERE size_min IS NOT NULL
  AND size_max IS NOT NULL;
```

---

## ✅ STATUT FINAL

**Projet :** qcqbtmvbvipsxwjlgjvk
**Date :** 12 janvier 2026
**Build :** ✅ SUCCÈS

### Migrations appliquées
1. ✅ `20260112094412_20260112_add_size_intervals_and_color_families.sql`
2. ✅ `20260112105618_add_size_intervals_to_product_variations.sql`

### Colonnes créées
- ✅ `profiles.user_size` (INTEGER)
- ✅ `product_variations.size_min` (INTEGER)
- ✅ `product_variations.size_max` (INTEGER)

### Code implémenté
- ✅ Page `/account/measurements`
- ✅ Composant `ProductCard` avec badge Match
- ✅ Script de test `test-user-size-system.js`

---

**Le système est opérationnel et prêt à l'emploi !** 🎉
