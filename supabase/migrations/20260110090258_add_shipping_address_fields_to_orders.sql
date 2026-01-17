/*
  # Ajout des champs d'adresse de livraison à la table orders

  ## Modifications

  ### Table `orders`
  - Ajout de `shipping_street` (text) - Rue de l'adresse de livraison
  - Ajout de `shipping_phone` (text) - Téléphone du destinataire

  ## Raison

  Ces champs permettent de stocker explicitement la rue et le téléphone de livraison
  dans des colonnes dédiées, facilitant leur utilisation dans les PDF, emails et
  l'administration des commandes.

  ## Notes

  - Les colonnes sont nullable car les anciennes commandes n'ont pas ces données
  - Les nouvelles commandes devront obligatoirement renseigner ces champs
  - Ces données complètent le champ JSONB `shipping_address` existant
*/

-- Ajout des colonnes pour l'adresse de livraison détaillée
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'shipping_street'
  ) THEN
    ALTER TABLE orders ADD COLUMN shipping_street text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'shipping_phone'
  ) THEN
    ALTER TABLE orders ADD COLUMN shipping_phone text;
  END IF;
END $$;
