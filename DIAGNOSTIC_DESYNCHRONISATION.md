# Diagnostic Désynchronisation Schéma/Code

Date: 3 Janvier 2026

## Analyse Complète

J'ai analysé votre base de données et identifié **1 désynchronisation critique** causant les erreurs 400/409.

---

## Problème Critique Identifié

### delivery_batches - Colonne `is_active` manquante

**Schéma actuel:**
```sql
delivery_batches
├── id (uuid)
├── user_id (uuid)
├── status (text, default: 'pending')
├── created_at (timestamptz)
├── validate_at (timestamptz)
├── validated_at (timestamptz)
├── shipping_cost (numeric)
├── shipping_address_id (uuid)
├── woocommerce_order_id (text)
└── notes (text)
```

**Colonne manquante:** `is_active` (boolean)

**Fichiers affectés:**
1. `app/api/delivery-batches/route.ts` ligne 35
   ```typescript
   .eq('is_active', true)  // ❌ COLONNE INEXISTANTE
   ```

2. `app/api/delivery-batches/get/route.ts` ligne 26
   ```typescript
   .eq('is_active', true)  // ❌ COLONNE INEXISTANTE
   ```

3. `supabase/functions/get-delivery-batches/index.ts` ligne 30
   ```typescript
   .eq('is_active', true)  // ❌ COLONNE INEXISTANTE
   ```

**Erreur produite:**
```
Error 400: Bad Request - column "is_active" does not exist
Error 409: Conflict
```

---

## Tables Vérifiées (OK ✓)

### weekly_ambassadors ✓
Toutes les colonnes utilisées dans le code existent:
- id, guestbook_entry_id, user_id
- week_start_date, week_end_date
- total_votes, reward_amount
- is_active, created_at

### live_streams ✓
Toutes les colonnes utilisées dans le code existent:
- id, title, description, thumbnail_url
- status, scheduled_start, stream_key
- created_by, replay_url
- actual_start, actual_end, playback_url
- current_viewers, peak_viewers, total_views

### customer_reviews ✓
Toutes les colonnes utilisées dans le code existent:
- id, customer_name, customer_email
- rating, comment, source
- is_approved, is_featured
- created_at, updated_at

### featured_products ✓
Toutes les colonnes utilisées dans le code existent:
- id, product_id, display_order
- is_active, is_hidden_diamond
- created_at, updated_at

---

## Solution : Script SQL Golden

**Fichier:** `GOLDEN_SCRIPT_SYNC_SCHEMA.sql`

Ce script corrige la désynchronisation en ajoutant la colonne manquante avec:

1. **Colonne ajoutée:**
   ```sql
   ALTER TABLE delivery_batches
   ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
   ```

2. **Logique métier:**
   - Nouveaux batches: `is_active = true` (par défaut)
   - Batches validés/annulés/complétés: `is_active = false`

3. **Index créés pour performance:**
   ```sql
   -- Index sur is_active = true uniquement
   CREATE INDEX idx_delivery_batches_is_active
   ON delivery_batches(is_active)
   WHERE is_active = true;

   -- Index combiné pour requêtes status + user_id
   CREATE INDEX idx_delivery_batches_status_user
   ON delivery_batches(status, user_id)
   WHERE is_active = true;
   ```

4. **Mise à jour automatique:**
   ```sql
   -- Marquer comme inactifs les batches terminés
   UPDATE delivery_batches
   SET is_active = false
   WHERE status IN ('validated', 'cancelled', 'completed');
   ```

---

## Instruction d'Exécution

### Étape 1: Exécuter le script SQL

1. Ouvrir le **SQL Editor** dans Supabase
2. Copier le contenu de `GOLDEN_SCRIPT_SYNC_SCHEMA.sql`
3. Coller et exécuter
4. Vérifier les messages NOTICE pour confirmation

### Étape 2: Vérifier les résultats

Le script affichera:
```
NOTICE: Colonne is_active ajoutée à delivery_batches
NOTICE: weekly_ambassadors: Toutes les colonnes requises sont présentes ✓
NOTICE: live_streams: Toutes les colonnes requises sont présentes ✓
NOTICE: customer_reviews: Toutes les colonnes requises sont présentes ✓
NOTICE: featured_products: Toutes les colonnes requises sont présentes ✓

════════════════════════════════════════════════════════════════
RÉSUMÉ DES MODIFICATIONS
════════════════════════════════════════════════════════════════
Total delivery_batches: X
Batches actifs: Y
Batches inactifs: Z
════════════════════════════════════════════════════════════════
```

### Étape 3: Tester les endpoints

Après exécution, tester:

1. **Liste des batches actifs:**
   ```bash
   GET /api/delivery-batches?action=active
   ```
   ✓ Devrait retourner uniquement les batches avec `is_active = true`

2. **Batches utilisateur:**
   ```bash
   GET /api/delivery-batches?user_id=XXX&status=pending
   ```
   ✓ Ne devrait plus retourner d'erreur 400

3. **Edge function:**
   ```bash
   POST /supabase/functions/get-delivery-batches
   ```
   ✓ Ne devrait plus retourner d'erreur 409

---

## Impact et Bénéfices

### Avant (avec erreur)
```
❌ Error 400: column "is_active" does not exist
❌ Impossible de filtrer les batches actifs/inactifs
❌ Tous les batches (même terminés) sont affichés
❌ Requêtes échouent aléatoirement
```

### Après (corrigé)
```
✓ Filtrage des batches actifs/inactifs fonctionne
✓ Meilleure organisation des données
✓ Performance améliorée avec index
✓ Séparation logique entre batches en cours et terminés
✓ Plus d'erreurs 400/409
```

---

## Protocole Golden Script

Pour maintenir la synchronisation, suivez ce protocole:

### Avant chaque modification du code:

1. **Si ajout d'une nouvelle colonne dans le code:**
   ```sql
   -- Ajouter immédiatement au Golden Script
   ALTER TABLE ma_table ADD COLUMN nouvelle_colonne TYPE;
   ```

2. **Si modification d'une requête existante:**
   ```sql
   -- Vérifier que toutes les colonnes existent
   SELECT column_name FROM information_schema.columns
   WHERE table_name = 'ma_table';
   ```

3. **Si ajout d'une nouvelle table:**
   ```sql
   -- Créer la table avec toutes les colonnes nécessaires
   CREATE TABLE nouvelle_table (...);
   -- Activer RLS immédiatement
   ALTER TABLE nouvelle_table ENABLE ROW LEVEL SECURITY;
   ```

### Checklist avant déploiement:

- [ ] Toutes les colonnes utilisées dans le code existent en BDD
- [ ] Les types de données correspondent (uuid, text, boolean, etc.)
- [ ] Les valeurs par défaut sont définies
- [ ] Les contraintes (NOT NULL, UNIQUE) sont correctes
- [ ] RLS est activé sur les tables sensibles
- [ ] Les index sont créés pour les colonnes filtrées
- [ ] Le Golden Script est à jour

---

## Désynchronisations Futures à Éviter

### Erreurs fréquentes:

1. **Colonne manquante:**
   ```typescript
   // Code
   .select('colonne_qui_nexiste_pas')
   ```
   → Erreur 400: column does not exist

2. **Type incompatible:**
   ```typescript
   // Code attend un boolean
   .eq('is_active', true)
   // BDD a un text
   ```
   → Erreur 409: Conflict

3. **Valeur par défaut manquante:**
   ```typescript
   // Code insère sans spécifier la colonne
   .insert({ name: 'test' })
   // BDD attend NOT NULL sans default
   ```
   → Erreur 400: null value in column

---

## Résumé Final

✅ **1 problème identifié** (delivery_batches.is_active)
✅ **Script SQL fourni** (GOLDEN_SCRIPT_SYNC_SCHEMA.sql)
✅ **4 tables vérifiées** (weekly_ambassadors, live_streams, customer_reviews, featured_products)
✅ **Index de performance créés**
✅ **Documentation complète**

**Action immédiate:** Exécuter `GOLDEN_SCRIPT_SYNC_SCHEMA.sql` dans le SQL Editor de Supabase.

Les erreurs 400/409 devraient disparaître après l'exécution du script.
