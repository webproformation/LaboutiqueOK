/*
  # Système de Diamants Cachés - Adaptation à la structure existante

  1. **Vue d'ensemble**
     - Adaptation du système aux tables existantes
     - Ajout de la table diamond_discoveries
     - Création des fonctions nécessaires

  2. **Tables utilisées**
     - `hidden_diamonds` : Table existante (location, page_url, element_selector)
     - `diamond_discoveries` : Nouvelle table pour suivi

  3. **Fonctionnement**
     - Admin place 3 diamants par semaine
     - Chaque utilisateur peut trouver tous les diamants
     - Récompense de 0,10€ par diamant

  4. **Sécurité**
     - RLS activé
     - Fonctions sécurisées
*/

-- =====================================================
-- 1. TABLE DES DÉCOUVERTES DE DIAMANTS
-- =====================================================

CREATE TABLE IF NOT EXISTS diamond_discoveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  diamond_id UUID NOT NULL REFERENCES hidden_diamonds(id) ON DELETE CASCADE,
  discovered_at TIMESTAMPTZ DEFAULT NOW(),
  reward_given BOOLEAN DEFAULT FALSE,
  UNIQUE(user_id, diamond_id)
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_discoveries_user ON diamond_discoveries(user_id);
CREATE INDEX IF NOT EXISTS idx_discoveries_diamond ON diamond_discoveries(diamond_id);
CREATE INDEX IF NOT EXISTS idx_discoveries_date ON diamond_discoveries(discovered_at);

-- =====================================================
-- 2. FONCTION POUR RÉCUPÉRER LES DIAMANTS VISIBLES
-- =====================================================

CREATE OR REPLACE FUNCTION get_visible_diamonds_for_user(p_user_id UUID)
RETURNS TABLE (
  diamond_id UUID,
  location TEXT,
  page_url TEXT,
  element_selector TEXT,
  reward_amount DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    hd.id,
    hd.location,
    hd.page_url,
    hd.element_selector,
    hd.reward_amount
  FROM hidden_diamonds hd
  WHERE hd.is_active = TRUE
    AND NOT EXISTS (
      SELECT 1 FROM diamond_discoveries dd
      WHERE dd.diamond_id = hd.id
        AND dd.user_id = p_user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. FONCTION POUR DÉCOUVRIR UN DIAMANT
-- =====================================================

CREATE OR REPLACE FUNCTION discover_diamond(
  p_user_id UUID,
  p_diamond_id UUID
) RETURNS JSON AS $$
DECLARE
  v_already_found BOOLEAN;
  v_diamond RECORD;
BEGIN
  -- Vérifier si déjà trouvé par cet utilisateur
  SELECT EXISTS (
    SELECT 1 FROM diamond_discoveries
    WHERE user_id = p_user_id AND diamond_id = p_diamond_id
  ) INTO v_already_found;

  IF v_already_found THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Diamant déjà trouvé'
    );
  END IF;

  -- Récupérer les infos du diamant
  SELECT id, is_active, reward_amount
  INTO v_diamond
  FROM hidden_diamonds
  WHERE id = p_diamond_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Diamant introuvable'
    );
  END IF;

  IF NOT v_diamond.is_active THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Diamant inactif'
    );
  END IF;

  -- Enregistrer la découverte
  INSERT INTO diamond_discoveries (user_id, diamond_id, reward_given)
  VALUES (p_user_id, p_diamond_id, TRUE);

  -- Ajouter la récompense via le système de fidélité
  PERFORM add_loyalty_transaction(
    p_user_id,
    'diamond_found',
    v_diamond.reward_amount,
    'Diamant caché trouvé',
    p_diamond_id::TEXT
  );

  RETURN json_build_object(
    'success', true,
    'message', 'Super, tu as trouvé un diamant qui te rapporte ' || v_diamond.reward_amount || '€ à ta cagnotte.',
    'amount', v_diamond.reward_amount,
    'show_confetti', true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. FONCTION POUR OBTENIR LES STATS DES DIAMANTS
-- =====================================================

CREATE OR REPLACE FUNCTION get_diamond_stats()
RETURNS TABLE (
  diamond_id UUID,
  week_number INTEGER,
  year INTEGER,
  location TEXT,
  total_discoveries BIGINT,
  is_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    hd.id,
    hd.week_number,
    hd.year,
    hd.location,
    COUNT(dd.id)::BIGINT as total_discoveries,
    hd.is_active
  FROM hidden_diamonds hd
  LEFT JOIN diamond_discoveries dd ON dd.diamond_id = hd.id
  GROUP BY hd.id, hd.week_number, hd.year, hd.location, hd.is_active
  ORDER BY hd.year DESC, hd.week_number DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. RLS POLICIES
-- =====================================================

ALTER TABLE diamond_discoveries ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs voient leurs propres découvertes
CREATE POLICY "Utilisateurs voient leurs découvertes"
  ON diamond_discoveries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Insertion via fonction SECURITY DEFINER
CREATE POLICY "Insertion découvertes via fonction"
  ON diamond_discoveries FOR INSERT
  TO authenticated
  WITH CHECK (true);