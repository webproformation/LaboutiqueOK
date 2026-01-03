/*
  ═══════════════════════════════════════════════════════════════════════════
  GOLDEN SCRIPT - SYNCHRONISATION SCHÉMA/CODE
  ═══════════════════════════════════════════════════════════════════════════

  Date: 3 Janvier 2026
  Objectif: Corriger les désynchronisations entre le code et le schéma BDD

  PROBLÈMES IDENTIFIÉS:
  ────────────────────────────────────────────────────────────────────────────
  1. delivery_batches: Colonne 'is_active' manquante
     - Fichiers affectés:
       • app/api/delivery-batches/route.ts (ligne 35)
       • app/api/delivery-batches/get/route.ts (ligne 26)
       • supabase/functions/get-delivery-batches/index.ts (ligne 30)
     - Erreur: 400 Bad Request ou 409 Conflict

  ═══════════════════════════════════════════════════════════════════════════
*/

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 1: DELIVERY_BATCHES - Ajouter colonne is_active
-- ═══════════════════════════════════════════════════════════════════════════

-- Ajouter la colonne is_active (boolean, default true)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'delivery_batches'
      AND column_name = 'is_active'
  ) THEN
    ALTER TABLE delivery_batches
    ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;

    RAISE NOTICE 'Colonne is_active ajoutée à delivery_batches';
  ELSE
    RAISE NOTICE 'Colonne is_active existe déjà dans delivery_batches';
  END IF;
END $$;

-- Mettre à jour les batches existants selon leur statut
-- Les batches "validated" ou "cancelled" deviennent inactifs
UPDATE delivery_batches
SET is_active = false
WHERE status IN ('validated', 'cancelled', 'completed')
  AND is_active = true;

COMMENT ON COLUMN delivery_batches.is_active IS
  'Indique si le batch est actif et visible. Les batches validés, annulés ou complétés sont inactifs.';

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 2: VÉRIFICATION DES AUTRES TABLES
-- ═══════════════════════════════════════════════════════════════════════════

-- Vérifier que toutes les colonnes utilisées dans le code existent

-- ─────────────────────────────────────────────────────────────────────────
-- 2.1 WEEKLY_AMBASSADORS - Vérification
-- ─────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  -- Vérifier que toutes les colonnes requises existent
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'weekly_ambassadors'
      AND column_name IN ('id', 'guestbook_entry_id', 'user_id', 'week_start_date',
                          'week_end_date', 'total_votes', 'reward_amount', 'is_active', 'created_at')
    GROUP BY table_name
    HAVING COUNT(*) = 9
  ) THEN
    RAISE WARNING 'weekly_ambassadors: Certaines colonnes sont manquantes!';
  ELSE
    RAISE NOTICE 'weekly_ambassadors: Toutes les colonnes requises sont présentes ✓';
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────
-- 2.2 LIVE_STREAMS - Vérification
-- ─────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'live_streams'
      AND column_name IN ('id', 'title', 'description', 'thumbnail_url', 'status',
                          'scheduled_start', 'stream_key', 'created_by', 'replay_url')
    GROUP BY table_name
    HAVING COUNT(*) = 9
  ) THEN
    RAISE WARNING 'live_streams: Certaines colonnes sont manquantes!';
  ELSE
    RAISE NOTICE 'live_streams: Toutes les colonnes requises sont présentes ✓';
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────
-- 2.3 CUSTOMER_REVIEWS - Vérification
-- ─────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'customer_reviews'
      AND column_name IN ('id', 'customer_name', 'rating', 'comment', 'is_approved',
                          'is_featured', 'created_at')
    GROUP BY table_name
    HAVING COUNT(*) = 7
  ) THEN
    RAISE WARNING 'customer_reviews: Certaines colonnes sont manquantes!';
  ELSE
    RAISE NOTICE 'customer_reviews: Toutes les colonnes requises sont présentes ✓';
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────
-- 2.4 FEATURED_PRODUCTS - Vérification
-- ─────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'featured_products'
      AND column_name IN ('id', 'product_id', 'display_order', 'is_active',
                          'is_hidden_diamond', 'created_at')
    GROUP BY table_name
    HAVING COUNT(*) = 6
  ) THEN
    RAISE WARNING 'featured_products: Certaines colonnes sont manquantes!';
  ELSE
    RAISE NOTICE 'featured_products: Toutes les colonnes requises sont présentes ✓';
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 3: INDEX POUR OPTIMISATION
-- ═══════════════════════════════════════════════════════════════════════════

-- Index sur delivery_batches.is_active (nouveau)
CREATE INDEX IF NOT EXISTS idx_delivery_batches_is_active
ON delivery_batches(is_active)
WHERE is_active = true;

-- Index sur delivery_batches (status + user_id) pour les requêtes combinées
CREATE INDEX IF NOT EXISTS idx_delivery_batches_status_user
ON delivery_batches(status, user_id)
WHERE is_active = true;

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 4: VÉRIFICATION FINALE
-- ═══════════════════════════════════════════════════════════════════════════

-- Afficher le résumé des modifications
DO $$
DECLARE
  v_delivery_batches_count INT;
  v_active_batches_count INT;
BEGIN
  SELECT COUNT(*) INTO v_delivery_batches_count FROM delivery_batches;
  SELECT COUNT(*) INTO v_active_batches_count FROM delivery_batches WHERE is_active = true;

  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'RÉSUMÉ DES MODIFICATIONS';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'Total delivery_batches: %', v_delivery_batches_count;
  RAISE NOTICE 'Batches actifs: %', v_active_batches_count;
  RAISE NOTICE 'Batches inactifs: %', v_delivery_batches_count - v_active_batches_count;
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
END $$;

/*
  ═══════════════════════════════════════════════════════════════════════════
  NOTES IMPORTANTES:
  ═══════════════════════════════════════════════════════════════════════════

  1. Ce script est IDEMPOTENT: vous pouvez l'exécuter plusieurs fois sans danger

  2. Les checks IF NOT EXISTS évitent les erreurs si les colonnes existent déjà

  3. Les colonnes ajoutées:
     - delivery_batches.is_active: boolean NOT NULL DEFAULT true

  4. Index créés pour améliorer les performances:
     - idx_delivery_batches_is_active (filtre sur is_active = true)
     - idx_delivery_batches_status_user (requêtes combinées)

  5. Logique métier:
     - Nouveaux batches: is_active = true par défaut
     - Batches validés/annulés/complétés: is_active = false

  ═══════════════════════════════════════════════════════════════════════════
  PROCHAINES ÉTAPES:
  ═══════════════════════════════════════════════════════════════════════════

  1. Exécuter ce script dans le SQL Editor de Supabase
  2. Vérifier les messages NOTICE pour confirmer les modifications
  3. Tester les endpoints API affectés:
     - GET /api/delivery-batches?action=active
     - GET /api/delivery-batches/get
  4. Vérifier qu'il n'y a plus d'erreurs 400/409 dans la console

  ═══════════════════════════════════════════════════════════════════════════
*/
