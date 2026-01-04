/*
  # Ajouter limite de parties par jour au jeu à gratter

  1. Modifications
    - Ajouter la colonne `max_plays_per_day` à `scratch_game_settings`
      - Limite le nombre de parties qu'un utilisateur peut jouer par jour
      - 0 = pas de limite journalière (utilise max_plays_per_user à la place)
      - Valeur par défaut: 0 (pas de limite journalière, fonctionne comme avant)
  
  2. Fonctions Helper
    - Créer une fonction `get_user_plays_today` pour compter les parties jouées aujourd'hui
  
  3. Notes Importantes
    - Cette limite est indépendante de max_plays_per_user
    - Si max_plays_per_day = 0, seul max_plays_per_user est vérifié
    - Si max_plays_per_day > 0, l'utilisateur peut jouer jusqu'à ce nombre par jour
*/

-- Ajouter la colonne max_plays_per_day
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scratch_game_settings' AND column_name = 'max_plays_per_day'
  ) THEN
    ALTER TABLE scratch_game_settings 
    ADD COLUMN max_plays_per_day integer DEFAULT 0 NOT NULL CHECK (max_plays_per_day >= 0);
  END IF;
END $$;

-- Créer une fonction pour compter les parties jouées aujourd'hui par un utilisateur
CREATE OR REPLACE FUNCTION get_user_plays_today(user_uuid uuid)
RETURNS integer AS $$
DECLARE
  plays_count integer;
BEGIN
  SELECT COUNT(*)
  INTO plays_count
  FROM scratch_game_plays
  WHERE user_id = user_uuid
  AND played_at >= CURRENT_DATE
  AND played_at < CURRENT_DATE + INTERVAL '1 day';
  
  RETURN COALESCE(plays_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permettre l'accès à cette fonction aux utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION get_user_plays_today(uuid) TO authenticated, anon;

-- Créer un commentaire pour documenter la colonne
COMMENT ON COLUMN scratch_game_settings.max_plays_per_day IS 'Nombre maximum de parties par jour (0 = pas de limite journalière)';
