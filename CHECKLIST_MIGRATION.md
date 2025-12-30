# ✅ CHECKLIST COMPLÈTE: Restauration au 28/12/2024 00h20

## 📋 PRÉPARATION (Avant de commencer)

- [ ] **BACKUP CRITIQUE**: Exportez votre base de données actuelle
  - Allez dans Supabase Dashboard > Database > Backups
  - Cliquez sur "Create backup now"
  - Attendez la confirmation
  
- [ ] Notez vos variables d'environnement actuelles
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  
- [ ] Vérifiez que vous avez accès à Supabase SQL Editor

---

## 🔄 ÉTAPE 1: Nettoyage de la base de données

### 1.1 Exécuter le script de nettoyage

- [ ] Ouvrez Supabase Dashboard > SQL Editor
- [ ] Copiez le contenu du fichier `MIGRATION_COMPLETE_FRESH_START.sql`
- [ ] Collez dans SQL Editor
- [ ] Cliquez sur "Run"
- [ ] Attendez le message "NETTOYAGE TERMINÉ"

**⏱️ Temps estimé: 30 secondes**

### 1.2 Vérification du nettoyage

- [ ] Exécutez cette requête pour vérifier:

```sql
SELECT COUNT(*) as remaining_tables 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

**Résultat attendu: 0 tables**

---

## 📦 ÉTAPE 2: Application des migrations

### Option A: Via Supabase CLI (Recommandé)

- [ ] Installez Supabase CLI:
```bash
npm install -g supabase
```

- [ ] Connectez-vous à votre projet:
```bash
supabase link --project-ref VOTRE_PROJECT_REF
```

- [ ] Listez les migrations disponibles:
```bash
ls -1 supabase/migrations/*.sql | head -110
```

- [ ] Appliquez les 110 migrations:
```bash
# Créez un script temporaire
cat > apply-migrations.sh << 'EOFSCRIPT'
#!/bin/bash
for migration in supabase/migrations/*.sql; do
  timestamp=$(basename "$migration" | cut -d'_' -f1)
  if [[ "$timestamp" < "20251228" ]]; then
    echo "Applying: $migration"
    supabase db push "$migration"
  fi
done
EOFSCRIPT

chmod +x apply-migrations.sh
./apply-migrations.sh
```

**⏱️ Temps estimé: 5-10 minutes**

### Option B: Via SQL Editor (Manuel)

- [ ] Pour chaque migration de `20251205133636` à `20251227231524`:
  - [ ] Ouvrez le fichier de migration
  - [ ] Copiez le contenu
  - [ ] Collez dans Supabase SQL Editor
  - [ ] Exécutez
  - [ ] Vérifiez qu'il n'y a pas d'erreur
  - [ ] Passez à la migration suivante

**⏱️ Temps estimé: 30-60 minutes**

### Option C: Script SQL Unique (À venir)

Si vous voulez un script SQL unique qui recrée tout:

- [ ] Contactez-moi pour que je génère le script complet
- [ ] Ce sera un fichier de ~10,000 lignes
- [ ] Exécution en une fois

---

## ✨ ÉTAPE 3: Import des données de configuration

### 3.1 Données essentielles

- [ ] Ouvrez Supabase SQL Editor
- [ ] Copiez le contenu de `IMPORT_EXAMPLE_DATA.sql`
- [ ] Exécutez le script
- [ ] Vérifiez le résumé affiché

**⏱️ Temps estimé: 30 secondes**

### 3.2 Vérification des données importées

- [ ] Exécutez:

```sql
SELECT 
  (SELECT COUNT(*) FROM loyalty_tiers) as tiers,
  (SELECT COUNT(*) FROM loyalty_rewards) as rewards,
  (SELECT COUNT(*) FROM coupon_types) as coupons,
  (SELECT COUNT(*) FROM shipping_methods) as shipping;
```

**Résultats attendus:**
- `tiers`: 4 (Bronze, Argent, Or, Platine)
- `rewards`: 6+
- `coupons`: 3+
- `shipping`: 3 (Colissimo, Mondial Relay, Chronopost)

---

## 👤 ÉTAPE 4: Création de l'utilisateur admin

### 4.1 Créer l'admin via l'interface

- [ ] Allez sur votre site: `/create-admin-webpro`
- [ ] Remplissez le formulaire:
  - Email: votre@email.com
  - Mot de passe: (choisissez un mot de passe fort)
- [ ] Cliquez sur "Créer l'admin"
- [ ] Notez le message de confirmation

### 4.2 Vérifier le rôle admin

- [ ] Exécutez dans Supabase SQL Editor:

```sql
SELECT 
  up.id,
  up.email,
  ur.role,
  ur.created_at
FROM user_profiles up
LEFT JOIN user_roles ur ON up.id = ur.user_id;
```

**Résultat attendu:** Une ligne avec role = 'admin'

### 4.3 Test de connexion

- [ ] Allez sur `/auth/login`
- [ ] Connectez-vous avec vos identifiants
- [ ] Allez sur `/admin`
- [ ] Vérifiez que vous avez accès au dashboard admin

---

## 🛍️ ÉTAPE 5: Synchronisation WooCommerce

### 5.1 Synchroniser les catégories

- [ ] Connectez-vous en tant qu'admin
- [ ] Allez sur `/admin/sync-categories`
- [ ] Cliquez sur "Synchroniser les catégories"
- [ ] Attendez la fin de la synchronisation
- [ ] Vérifiez le nombre de catégories importées

### 5.2 Synchroniser les produits

- [ ] Allez sur `/admin/products`
- [ ] Les produits devraient s'afficher via l'API WooCommerce
- [ ] Si rien ne s'affiche, vérifiez vos variables d'environnement WordPress

### 5.3 Test du cache WooCommerce

- [ ] Exécutez:

```sql
SELECT 
  cache_key,
  expires_at,
  created_at
FROM woocommerce_cache
ORDER BY created_at DESC
LIMIT 5;
```

**Si vide:** Normal, le cache se remplit automatiquement lors des requêtes

---

## 🏠 ÉTAPE 6: Configuration de la page d'accueil

### 6.1 Ajouter les slides du carrousel

- [ ] Allez sur `/admin/slides`
- [ ] Ajoutez au moins 3 slides:
  - Image (via WordPress Media)
  - Titre
  - Description
  - Ordre d'affichage
- [ ] Activez les slides
- [ ] Vérifiez sur la page d'accueil

### 6.2 Configurer les catégories en avant

- [ ] Allez sur `/admin/home-categories`
- [ ] Ajoutez 4-6 catégories à mettre en avant
- [ ] Choisissez les images
- [ ] Définissez l'ordre d'affichage
- [ ] Vérifiez sur la page d'accueil

### 6.3 Produits en vedette

- [ ] Allez sur `/admin/featured-products`
- [ ] Sélectionnez 6-8 produits
- [ ] Définissez l'ordre
- [ ] Vérifiez sur la page d'accueil

---

## 🎮 ÉTAPE 7: Configuration des jeux

### 7.1 Jeu de grattage

- [ ] Allez sur `/admin/scratch-game-settings`
- [ ] Configurez:
  - [ ] Activer le jeu
  - [ ] Montant du prize pool
  - [ ] Nombre de parties par jour (3 recommandé)
- [ ] Sauvegardez

### 7.2 Roue de la chance

- [ ] Allez sur `/admin/wheel-game-settings`
- [ ] Configurez:
  - [ ] Activer le jeu
  - [ ] Afficher le popup automatiquement
- [ ] Sauvegardez

### 7.3 Test des jeux

- [ ] Déconnectez-vous
- [ ] Allez sur la page d'accueil
- [ ] Vérifiez que les popups s'affichent
- [ ] Testez une partie de chaque jeu

---

## 📊 ÉTAPE 8: Vérification finale

### 8.1 Vérification du schéma

- [ ] Exécutez:

```sql
SELECT 
  'Tables' as type,
  COUNT(*)::text as count
FROM information_schema.tables 
WHERE table_schema = 'public'

UNION ALL

SELECT 
  'Policies RLS',
  COUNT(*)::text
FROM pg_policies 
WHERE schemaname = 'public'

UNION ALL

SELECT 
  'Fonctions',
  COUNT(*)::text
FROM pg_proc 
INNER JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid
WHERE pg_namespace.nspname = 'public';
```

**Résultats attendus:**
- Tables: ~60
- Policies RLS: ~200+
- Fonctions: ~20+

### 8.2 Vérification des Edge Functions

- [ ] Listez les Edge Functions déployées:

```bash
curl https://VOTRE_PROJECT.supabase.co/functions/v1/
```

**Résultat attendu:** Liste de ~40 fonctions

### 8.3 Test de navigation

- [ ] Page d'accueil: `/__tests__`
- [ ] Catégories: `/category/vetements`
- [ ] Produit: `/product/test-product`
- [ ] Panier: `/cart`
- [ ] Compte: `/account`
- [ ] Admin: `/admin`

---

## 🎉 ÉTAPE 9: Post-restauration

### 9.1 Recréer les contenus

- [ ] Actualités: `/admin/actualites`
  - [ ] Créez quelques articles de blog
  
- [ ] Looks de Morgane: `/admin/looks`
  - [ ] Créez des looks avec produits associés
  
- [ ] Ambassadrice de la semaine: `/admin/ambassadrice`
  - [ ] Sélectionnez une ambassadrice

### 9.2 Configuration SEO

- [ ] Allez sur `/admin/seo`
- [ ] Configurez les métadonnées pour:
  - [ ] Page d'accueil
  - [ ] Pages principales (CGV, Contact, etc.)
  - [ ] Catégories principales

### 9.3 Notifications Push

- [ ] Allez sur `/admin/notifications-push`
- [ ] Testez l'envoi d'une notification test
- [ ] Vérifiez la réception

---

## 📝 RÉSUMÉ FINAL

Une fois toutes les étapes complétées:

- ✅ Base de données restaurée (schéma + config)
- ✅ Utilisateur admin créé
- ✅ Synchronisation WooCommerce active
- ✅ Page d'accueil configurée
- ✅ Jeux activés
- ✅ Edge Functions fonctionnelles

---

## 🆘 EN CAS DE PROBLÈME

### Erreur "relation does not exist"
➡️ Une migration n'a pas été appliquée correctement
➡️ Vérifiez le numéro de la migration manquante
➡️ Réappliquez-la manuellement

### Erreur "new row violates RLS policy"
➡️ Les policies RLS bloquent l'insertion
➡️ Vérifiez que vous êtes connecté en tant qu'admin
➡️ Ou utilisez le service role key

### Les produits ne s'affichent pas
➡️ Vérifiez les variables d'environnement WordPress
➡️ Testez l'API WooCommerce avec `/admin/diagnostic`
➡️ Vérifiez le cache avec `SELECT * FROM woocommerce_cache`

### Les Edge Functions ne fonctionnent pas
➡️ Vérifiez qu'elles sont déployées
➡️ Testez avec `/admin/diagnostic-complet`
➡️ Vérifiez les secrets avec `/test-secrets`

---

**Durée totale estimée: 15-30 minutes (avec CLI) ou 1-2 heures (manuel)**

**Dernière mise à jour:** 30/12/2024
**Migration de référence:** 20251227231524
