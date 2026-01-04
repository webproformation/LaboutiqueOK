/*
  # Création des tables profiles et addresses pour l'authentification

  ## Nouvelles Tables
  
  ### `profiles`
  - `id` (uuid, primary key) - Référence auth.users.id
  - `email` (text, not null) - Email de l'utilisateur
  - `first_name` (text) - Prénom
  - `last_name` (text) - Nom
  - `phone` (text) - Téléphone
  - `avatar_url` (text) - URL de la photo de profil
  - `birth_date` (date) - Date de naissance
  - `wallet_balance` (numeric) - Solde du porte-monnaie (défaut: 0)
  - `is_admin` (boolean) - Indicateur administrateur (défaut: false)
  - `blocked` (boolean) - Compte bloqué (défaut: false)
  - `blocked_reason` (text) - Raison du blocage
  - `blocked_at` (timestamptz) - Date du blocage
  - `cancelled_orders_count` (integer) - Nombre de commandes annulées (défaut: 0)
  - `created_at` (timestamptz) - Date de création
  - `updated_at` (timestamptz) - Date de mise à jour
  
  ### `addresses`
  - `id` (uuid, primary key) - Identifiant unique
  - `user_id` (uuid, not null) - Référence auth.users.id
  - `label` (text) - Libellé de l'adresse (ex: "Maison", "Travail")
  - `first_name` (text, not null) - Prénom
  - `last_name` (text, not null) - Nom
  - `address_line1` (text, not null) - Ligne d'adresse 1
  - `address_line2` (text) - Ligne d'adresse 2
  - `city` (text, not null) - Ville
  - `postal_code` (text, not null) - Code postal
  - `country` (text) - Pays (défaut: "France")
  - `phone` (text, not null) - Téléphone
  - `is_default` (boolean) - Adresse par défaut (défaut: false)
  - `created_at` (timestamptz) - Date de création
  - `updated_at` (timestamptz) - Date de mise à jour

  ## Sécurité
  
  ### RLS (Row Level Security)
  
  #### Policies pour `profiles`:
  - Les utilisateurs authentifiés peuvent lire leur propre profil
  - Les utilisateurs authentifiés peuvent créer leur propre profil
  - Les utilisateurs authentifiés peuvent mettre à jour leur propre profil
  
  #### Policies pour `addresses`:
  - Les utilisateurs authentifiés peuvent lire leurs propres adresses
  - Les utilisateurs authentifiés peuvent créer leurs propres adresses
  - Les utilisateurs authentifiés peuvent mettre à jour leurs propres adresses
  - Les utilisateurs authentifiés peuvent supprimer leurs propres adresses

  ## Notes importantes
  - Les profils sont liés aux comptes auth.users via cascade delete
  - Le wallet_balance permet de stocker les crédits fidélité
  - Le système de blocage permet de suspendre un compte avec raison
  - Les adresses supportent plusieurs adresses par utilisateur avec une adresse par défaut
*/

-- Création de la table profiles
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  first_name text DEFAULT '',
  last_name text DEFAULT '',
  phone text DEFAULT '',
  avatar_url text DEFAULT '',
  birth_date date,
  wallet_balance numeric(10,2) DEFAULT 0,
  is_admin boolean DEFAULT false,
  blocked boolean DEFAULT false,
  blocked_reason text,
  blocked_at timestamptz,
  cancelled_orders_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Activation de RLS pour profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies pour profiles
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Création de la table addresses
CREATE TABLE IF NOT EXISTS addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label text DEFAULT '',
  first_name text NOT NULL,
  last_name text NOT NULL,
  address_line1 text NOT NULL,
  address_line2 text DEFAULT '',
  city text NOT NULL,
  postal_code text NOT NULL,
  country text DEFAULT 'France',
  phone text NOT NULL,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Activation de RLS pour addresses
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

-- Policies pour addresses
CREATE POLICY "Users can read own addresses"
  ON addresses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own addresses"
  ON addresses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own addresses"
  ON addresses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own addresses"
  ON addresses FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);