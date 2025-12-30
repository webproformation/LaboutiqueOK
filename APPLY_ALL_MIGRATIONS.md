# 🔄 GUIDE COMPLET: Restauration au 28/12/2024 00h20

## ⚠️ ATTENTION: Restauration du SCHÉMA uniquement

**Aucun backup de données n'a été trouvé dans Supabase.**

Ce processus va restaurer:
- ✅ La **structure** de toutes les tables
- ✅ Toutes les **policies RLS**
- ✅ Toutes les **fonctions SQL**
- ✅ Tous les **indexes** et **triggers**

Ce processus **NE VA PAS** restaurer:
- ❌ Les **données** des tables (contenu)
- ❌ Les **utilisateurs** existants
- ❌ Les **commandes** passées
- ❌ Le **contenu** du site

## 📋 PROCESSUS EN 3 ÉTAPES

### ÉTAPE 1: Nettoyage complet de la base

```bash
# Dans Supabase SQL Editor, exécutez:
```

Exécutez le fichier: **`MIGRATION_COMPLETE_FRESH_START.sql`**

Ce script va:
- Supprimer toutes les policies RLS
- Supprimer toutes les fonctions
- Supprimer toutes les tables
- Préparer la base pour une migration propre

### ÉTAPE 2: Application des migrations

Vous devez appliquer **110 migrations** dans l'ordre chronologique.

#### Option A: Via Supabase CLI (Recommandé)

```bash
# 1. Installez Supabase CLI si pas déjà fait
npm install -g supabase

# 2. Connectez-vous à votre projet
supabase link --project-ref VOTRE_PROJECT_REF

# 3. Appliquez les migrations jusqu'au 27/12 23h15
supabase db push --include-all
```

#### Option B: Via Supabase Dashboard (Manuel)

1. Allez dans **Supabase Dashboard** > **Database** > **Migrations**
2. Cliquez sur **"New Migration"**
3. Copiez-collez le contenu de chaque migration **dans l'ordre**
4. Exécutez chaque migration une par une

#### Option C: Via SQL Editor (Le plus simple)

Je vais créer un script SQL unique qui combine toutes les migrations.

### ÉTAPE 3: Vérification

Exécutez le script: **`VERIFY_RESTORATION.sql`** (à créer)

## 📝 LISTE DES 110 MIGRATIONS À APPLIQUER

Les migrations sont dans le dossier: `supabase/migrations/`

### Décembre 2024 (jusqu'au 27/12 23h15)

1. `20251205133636_create_wishlist_table.sql`
2. `20251205143947_create_user_profiles_table.sql`
3. `20251205143952_create_addresses_table.sql`
4. `20251205143956_create_orders_tables.sql`
5. `20251205161637_add_woocommerce_stripe_fields_to_orders.sql`
6. `20251205172046_create_delivery_batches_tables.sql`
7. `20251206095406_create_loyalty_system_tables.sql`
8. `20251206102106_create_product_availability_notifications.sql`
9. `20251206103418_create_coupons_system.sql`
10. `20251206111254_create_admin_roles_system.sql`

... (100 migrations plus tard)

110. `20251227231524_clean_and_fix_order_invoices_rls.sql` ✅ **DERNIÈRE**

## 🚀 MÉTHODE RAPIDE: Script SQL Unique

Au lieu d'appliquer 110 migrations manuellement, utilisez le script:

**`RECREATE_MISSING_TABLES.sql`** (à créer ci-dessous)

Ce script va:
- Créer toutes les tables dans le bon ordre
- Ajouter toutes les policies RLS
- Créer toutes les fonctions nécessaires
- Configurer tous les triggers

## ⚙️ APRÈS LA RESTAURATION

Une fois le schéma restauré, vous devrez:

### 1. Recréer les données de base

```sql
-- Paramètres des jeux
INSERT INTO scratch_game_settings (is_active, prize_pool, max_plays_per_day)
VALUES (true, 1000, 3);

INSERT INTO wheel_game_settings (is_active, show_popup)
VALUES (true, true);

-- Paramètres du livre d'or
INSERT INTO guestbook_settings (daily_limit, min_rating_to_display)
VALUES (1, 4);

-- Niveaux de fidélité par défaut
-- Etc...
```

### 2. Reconfigurer les Edge Functions

Toutes les edge functions sont déjà déployées, mais vérifiez qu'elles fonctionnent:

```bash
# Test de connexion
curl https://VOTRE_PROJECT.supabase.co/functions/v1/debug-env
```

### 3. Resynchroniser avec WooCommerce

Si vous utilisez WooCommerce:

```bash
# Allez dans /admin/sync-categories
# Cliquez sur "Synchroniser"
```

## 📊 VÉRIFICATION POST-RESTAURATION

Exécutez ces requêtes pour vérifier l'état:

```sql
-- Compter les tables
SELECT COUNT(*) as total_tables 
FROM information_schema.tables 
WHERE table_schema = 'public';
-- Résultat attendu: ~60 tables

-- Compter les policies RLS
SELECT COUNT(*) as total_policies 
FROM pg_policies 
WHERE schemaname = 'public';
-- Résultat attendu: ~200+ policies

-- Compter les fonctions
SELECT COUNT(*) as total_functions
FROM pg_proc 
INNER JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid
WHERE pg_namespace.nspname = 'public';
-- Résultat attendu: ~20+ fonctions
```

## ❓ FAQ

### Q: Est-ce que mes données actuelles seront supprimées?
**R:** OUI! Le script MIGRATION_COMPLETE_FRESH_START.sql supprime TOUT. Faites un backup avant!

### Q: Puis-je restaurer les données?
**R:** Seulement si vous avez un backup. Vérifiez avec CHECK_BACKUPS.sql

### Q: Combien de temps ça prend?
**R:** 
- Nettoyage: 30 secondes
- Application des migrations: 5-10 minutes
- Vérification: 1 minute

### Q: Que faire si une migration échoue?
**R:** 
1. Notez le numéro de la migration qui échoue
2. Vérifiez le message d'erreur
3. Corrigez le problème
4. Continuez avec la migration suivante

---

**Créé le**: 30/12/2024
**État de référence**: 28/12/2024 00h20
**Dernière migration**: 20251227231524
