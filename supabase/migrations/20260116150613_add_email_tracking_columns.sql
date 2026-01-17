/*
  # Ajout des colonnes de tracking pour les e-mails

  1. Modifications
    - Ajoute `abandoned_cart_email_sent` sur `profiles` pour tracker les e-mails panier abandonné
    - Ajoute `warning_email_sent` sur `open_packages` pour tracker les alertes de fermeture
    - Ajoute `review_email_sent` sur `orders` pour tracker les demandes d'avis
    - Ajoute `shipped_at` sur `orders` pour calculer la date d'envoi de l'e-mail d'avis (7 jours après)

  2. Notes
    - Ces colonnes empêchent l'envoi multiple du même e-mail
    - Les valeurs par défaut sont `false` ou `null`
*/

-- Profils : tracking panier abandonné
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS abandoned_cart_email_sent BOOLEAN DEFAULT false;

-- Open Packages : tracking alerte fin de colis
ALTER TABLE open_packages
ADD COLUMN IF NOT EXISTS warning_email_sent BOOLEAN DEFAULT false;

-- Orders : tracking demande d'avis et date d'expédition
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS review_email_sent BOOLEAN DEFAULT false;

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ;

-- Index pour optimiser les requêtes CRON
CREATE INDEX IF NOT EXISTS idx_profiles_abandoned_cart
ON profiles(abandoned_cart_email_sent)
WHERE abandoned_cart_email_sent = false;

CREATE INDEX IF NOT EXISTS idx_open_packages_warning
ON open_packages(status, closes_at, warning_email_sent)
WHERE status = 'active' AND warning_email_sent = false;

CREATE INDEX IF NOT EXISTS idx_orders_review_email
ON orders(status, shipped_at, review_email_sent)
WHERE status = 'shipped' AND review_email_sent = false;
