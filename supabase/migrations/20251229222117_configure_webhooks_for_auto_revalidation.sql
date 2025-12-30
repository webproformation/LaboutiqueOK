/*
  # Configuration des Webhooks Database pour revalidation automatique
  
  Cette migration configure les webhooks Supabase pour appeler automatiquement
  la fonction Edge "webhook-revalidator" lors des modifications de données.
  
  Tables surveillées :
  - home_slides (page d'accueil)
  - home_categories (page d'accueil)
  - featured_products (page d'accueil)
  - delivery_batches (bannière de livraison)
  - live_streams (page live)
  - guestbook_entries (livre d'or)
  - customer_reviews (avis clients)
  - news_posts (actualités)
  - weekly_ambassadors (ambassadrice de la semaine)
  - gift_thresholds (cadeaux paliers)
  - loyalty_tiers (niveaux de fidélité)
  
  IMPORTANT: Après cette migration, allez dans Supabase Dashboard > Database > Webhooks
  et créez manuellement les webhooks suivants :
  
  URL: https://qcqbtmvbvipsxwjlgjvk.supabase.co/functions/v1/webhook-revalidator
  
  Pour chaque table listée ci-dessus :
  1. Nom: "revalidate_[nom_table]"
  2. Table: [nom_table]
  3. Events: INSERT, UPDATE, DELETE
  4. Type: POST
  5. HTTP Headers: 
     - Authorization: Bearer [SUPABASE_ANON_KEY]
  6. Payload: 
     {
       "table": "[nom_table]",
       "type": "{{operation}}",
       "record": {{record}},
       "old_record": {{old_record}}
     }
*/

-- Cette migration documente la configuration manuelle requise
-- Les webhooks Database ne peuvent pas être créés via SQL
-- Ils doivent être configurés via le Dashboard Supabase

SELECT 'Webhooks doivent être configurés manuellement dans Supabase Dashboard' as notice;
