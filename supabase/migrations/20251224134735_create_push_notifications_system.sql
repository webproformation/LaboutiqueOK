/*
  # Système de Notifications Web Push

  1. Nouvelles Tables
    - `push_notifications`
      - `id` (uuid, primary key)
      - `notification_type` (text) - Type: 'live', 'new_products', 'hidden_diamond'
      - `title` (text)
      - `message` (text)
      - `url` (text) - URL de redirection
      - `image_url` (text, nullable)
      - `sent_by` (uuid, foreign key vers profiles)
      - `sent_at` (timestamp)
      - `onesignal_id` (text) - ID de notification OneSignal
      - `recipients_count` (integer) - Nombre de destinataires
      - `success` (boolean)
      - `created_at` (timestamp)

    - `push_notification_settings`
      - `id` (uuid, primary key)
      - `max_notifications_per_day` (integer) - Limite quotidienne
      - `onesignal_app_id` (text)
      - `auto_notify_new_live` (boolean)
      - `auto_notify_hidden_diamond` (boolean)
      - `updated_at` (timestamp)

  2. Sécurité
    - RLS activé sur toutes les tables
    - Seuls les admins peuvent gérer les notifications
    - Tout le monde peut lire les paramètres (pour afficher les limites)
*/

-- Table pour l'historique des notifications
CREATE TABLE IF NOT EXISTS push_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_type TEXT NOT NULL CHECK (notification_type IN ('live', 'new_products', 'hidden_diamond', 'custom')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  url TEXT,
  image_url TEXT,
  sent_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  sent_at TIMESTAMPTZ DEFAULT now(),
  onesignal_id TEXT,
  recipients_count INTEGER DEFAULT 0,
  success BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_push_notifications_sent_at ON push_notifications(sent_at);
CREATE INDEX IF NOT EXISTS idx_push_notifications_type ON push_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_push_notifications_sent_by ON push_notifications(sent_by);

-- Table pour les paramètres du système de notifications
CREATE TABLE IF NOT EXISTS push_notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  max_notifications_per_day INTEGER DEFAULT 2,
  onesignal_app_id TEXT DEFAULT 'lyw37xkvbuyieuz6uhondc5co',
  auto_notify_new_live BOOLEAN DEFAULT true,
  auto_notify_hidden_diamond BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insérer les paramètres par défaut
INSERT INTO push_notification_settings (
  max_notifications_per_day,
  onesignal_app_id,
  auto_notify_new_live,
  auto_notify_hidden_diamond
) VALUES (
  2,
  'lyw37xkvbuyieuz6uhondc5co',
  true,
  true
)
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE push_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_notification_settings ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour push_notifications

-- Admins peuvent tout lire
CREATE POLICY "Admins peuvent lire toutes les notifications"
  ON push_notifications FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

-- Admins peuvent créer des notifications
CREATE POLICY "Admins peuvent créer des notifications"
  ON push_notifications FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

-- Admins peuvent modifier les notifications
CREATE POLICY "Admins peuvent modifier les notifications"
  ON push_notifications FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()));

-- Politiques RLS pour push_notification_settings

-- Tout le monde peut lire les paramètres
CREATE POLICY "Tous peuvent lire les paramètres de notification"
  ON push_notification_settings FOR SELECT
  TO authenticated, anon
  USING (true);

-- Seuls les admins peuvent modifier les paramètres
CREATE POLICY "Admins peuvent modifier les paramètres"
  ON push_notification_settings FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()));

-- Fonction pour vérifier la limite quotidienne de notifications
CREATE OR REPLACE FUNCTION check_daily_notification_limit()
RETURNS JSON AS $$
DECLARE
  v_limit INTEGER;
  v_today_count INTEGER;
  v_result JSON;
BEGIN
  -- Récupérer la limite quotidienne
  SELECT max_notifications_per_day INTO v_limit
  FROM push_notification_settings
  LIMIT 1;

  -- Compter les notifications d'aujourd'hui
  SELECT COUNT(*) INTO v_today_count
  FROM push_notifications
  WHERE sent_at >= CURRENT_DATE
  AND success = true;

  v_result := json_build_object(
    'limit', v_limit,
    'sent_today', v_today_count,
    'can_send', v_today_count < v_limit,
    'remaining', GREATEST(0, v_limit - v_today_count)
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
