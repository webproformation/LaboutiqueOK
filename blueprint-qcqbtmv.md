# 🗺️ BLUEPRINT PROJET qcqbtmv - LA BOUTIQUE DE MORGANE

**Projet Supabase**: `qcqbtmvbvipsxwjlgjvk`
**URL Production**: `https://qcqbtmvbvipsxwjlgjvk.supabase.co`
**Date de création**: 2026-01-04
**Dernière mise à jour**: 2026-01-08

---

## 📋 TABLE DES MATIÈRES

1. [Architecture Globale](#architecture-globale)
2. [Arborescence du Projet](#arborescence-du-projet)
3. [Configuration et Environnement](#configuration-et-environnement)
4. [Fichiers Critiques](#fichiers-critiques)
5. [Routes API](#routes-api)
6. [Schéma de Base de Données](#schéma-de-base-de-données)
7. [Systèmes Clés](#systèmes-clés)
8. [Migrations Supabase](#migrations-supabase)

---

## 🏗️ ARCHITECTURE GLOBALE

### Stack Technique
- **Framework**: Next.js 13.5.1 (App Router)
- **Base de données**: Supabase PostgreSQL
- **Authentification**: Supabase Auth (email/password)
- **Storage**: Supabase Storage (product-images, category-images)
- **Styling**: TailwindCSS + shadcn/ui
- **State Management**: Zustand + React Context
- **Paiements**: Stripe (live) + PayPal
- **Livraison**: Mondial Relay API

### Particularités du Projet
- **IDs produits en TEXT**: Héritage WordPress (ex: "571", "102")
- **Verrouillage projet**: Protection anti-revert vers mcstv
- **Conversion WebP**: Automatique sur tous les uploads
- **RLS strict**: Toutes les tables protégées
- **Vue unifiée**: `unified_media` pour la médiathèque

---

## 📁 ARBORESCENCE DU PROJET

```
/tmp/cc-agent/62170990/project/
├── .bolt/                          # Configuration et protections projet
│   ├── verify-qcqbtmv.sh          # Script de vérification intégrité
│   ├── AI-INSTRUCTIONS.md         # Instructions IA
│   └── PROJECT-LOCK.json          # Verrouillage projet
│
├── app/                            # Next.js App Router
│   ├── globals.css                # Styles globaux
│   ├── layout.tsx                 # Layout racine (Pangolin font)
│   ├── page.tsx                   # Page d'accueil
│   │
│   ├── account/                   # Espace client
│   │   ├── page.tsx              # Dashboard utilisateur
│   │   ├── addresses/            # Gestion adresses
│   │   ├── measurements/         # Mensurations
│   │   ├── open-package/         # Ouverture colis
│   │   ├── orders/               # Commandes
│   │   └── referral/             # Parrainage
│   │
│   ├── admin/                     # Back-office (protégé is_admin)
│   │   ├── actualites/           # Gestion actualités
│   │   ├── categories-management/ # Gestion catégories
│   │   ├── coupons/              # Gestion codes promo
│   │   ├── featured-products/    # Produits mis en avant
│   │   ├── guestbook/            # Livre d'or
│   │   ├── home-categories/      # Catégories homepage
│   │   ├── looks-management/     # Looks Morgane
│   │   ├── media/                # Médiathèque (unified_media)
│   │   ├── orders/               # Gestion commandes
│   │   ├── products/             # Gestion produits
│   │   ├── returns-management/   # Gestion retours
│   │   ├── sauvegarde/           # Export base de données
│   │   ├── scratch-cards/        # Jeux à gratter
│   │   └── wheel/                # Roue de la chance
│   │
│   ├── api/                       # Routes API Next.js
│   │   ├── mondial-relay/search/ # Recherche points relais
│   │   ├── paypal/               # Paiements PayPal
│   │   ├── storage/upload/       # Upload média + insertion DB
│   │   └── stripe/               # Paiements Stripe
│   │
│   ├── auth/                      # Authentification
│   │   ├── login/                # Connexion
│   │   ├── register/             # Inscription
│   │   ├── forgot-password/      # Mot de passe oublié
│   │   └── reset-password/       # Réinitialisation
│   │
│   ├── cart/                      # Panier
│   ├── checkout/                  # Tunnel d'achat
│   │   └── confirmation/         # Confirmation commande
│   │
│   ├── product/[slug]/            # Page produit dynamique
│   ├── category/[slug]/           # Page catégorie dynamique
│   ├── actualites/                # Blog/actualités
│   ├── livre-dor/                 # Livre d'or public
│   ├── les-looks-de-morgane/      # Galerie looks
│   └── wishlist/                  # Liste de souhaits
│
├── components/                     # Composants React
│   ├── ui/                        # shadcn/ui components (58 fichiers)
│   ├── AdminBanner.tsx            # Bandeau admin
│   ├── header.tsx                 # En-tête site
│   ├── mega-menu.tsx              # Menu principal
│   ├── mobile-menu.tsx            # Menu mobile
│   ├── site-footer.tsx            # Pied de page
│   ├── ProductCard.tsx            # Carte produit
│   ├── ProductGallery.tsx         # Galerie produit
│   ├── ProductVariationSelector.tsx # Sélecteur variations (fix #31)
│   ├── MediaLibrary.tsx           # Sélecteur média (unified_media)
│   ├── RichTextEditor.tsx         # Éditeur texte riche
│   ├── WheelGame.tsx              # Roue de la chance
│   ├── ScratchCardGame.tsx        # Jeu à gratter
│   └── loyalty-bar.tsx            # Barre fidélité
│
├── context/                        # Contextes React
│   ├── AuthContext.tsx            # Contexte authentification
│   ├── CartContext.tsx            # Contexte panier
│   └── WishlistContext.tsx        # Contexte wishlist
│
├── hooks/                          # Hooks personnalisés
│   ├── use-coupons.ts             # Hook gestion coupons
│   ├── use-gift-progress.ts       # Hook progression cadeaux
│   ├── use-guestbook.ts           # Hook livre d'or
│   ├── use-looks.ts               # Hook looks Morgane
│   ├── use-open-package.ts        # Hook ouverture colis
│   ├── use-returns.ts             # Hook retours
│   ├── use-toast.ts               # Hook notifications
│   └── use-wallet-balance.ts      # Hook portefeuille
│
├── lib/                            # Bibliothèques utilitaires
│   ├── supabase.ts                # Client Supabase (VERROUILLÉ)
│   └── utils.ts                   # Utilitaires (cn, decodeHtmlEntities)
│
├── stores/                         # Stores Zustand
│   ├── auth-store.ts              # Store authentification
│   └── products-store.ts          # Store produits
│
├── types/                          # Types TypeScript
│   └── product.ts                 # Types Product & Category
│
├── supabase/migrations/            # Migrations base de données (73 fichiers)
│   └── [voir section dédiée]
│
├── scripts/                        # Scripts utilitaires (45 fichiers)
│   ├── create-admin-user.js       # Création compte admin
│   ├── smoke-test-final.js        # Tests smoke
│   └── verify-categories.js       # Vérification catégories
│
├── public/                         # Assets statiques
│   ├── lbdm-logoboutique.png     # Logo boutique
│   ├── lbdm-icone.png            # Icône
│   └── clear-cache.html          # Page clear cache
│
├── .env                           # Variables d'environnement (VERROUILLÉ)
├── next.config.js                 # Configuration Next.js
├── tailwind.config.ts             # Configuration Tailwind
├── tsconfig.json                  # Configuration TypeScript
├── package.json                   # Dépendances npm
└── vercel.json                    # Configuration Vercel
```

---

## ⚙️ CONFIGURATION ET ENVIRONNEMENT

### Variables d'environnement (.env)

```bash
# ⚠️ VERROUILLAGE PROJET qcqbtmvbvipsxwjlgjvk
NEXT_PUBLIC_SUPABASE_URL=https://qcqbtmvbvipsxwjlgjvk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# WordPress / WooCommerce (source de données)
WORDPRESS_URL=https://wp.laboutiquedemorgane.com
WORDPRESS_USERNAME=webproformation.fr
WORDPRESS_APP_PASSWORD=1ZENOcErQzBZFqaF5TtsQzGC
WOOCOMMERCE_CONSUMER_KEY=ck_d620ae1f9fcd1832bdb2c31fe3ad8362a9de8b28
WOOCOMMERCE_CONSUMER_SECRET=cs_f452fc79440e83b64d6c3a0c712d51c91c8dd5a4

# APIs tierces
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyCaMpoky_a5DGD5Hs1cA9OBLw2pUkqjTRU
BREVO_API_KEY=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

# Paiements (PRODUCTION)
STRIPE_SECRET_KEY=rk_live_51SUr5xPQtkhTJgDovlbmLd516kKVPUq...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51SUr5xPQtkhTJgDoeF...
PAYPAL_CLIENT_ID=BAACikVdtpOx8gP2eh1n7xQdrCE3SAVWfIQsB17pS...
PAYPAL_CLIENT_SECRET=ELjeY6wp47qSK8e74Hwch-ro8fgVcCxVWtIyk2D8c...

# Notifications push
ONESIGNAL_API_KEY=os_v2_app_poq5pgl2cze63gx6dphwforo5erqsjl3cqyegwv2lpyae34ra2v...
ONESIGNAL_APP_ID=rqsjl3cqyegwv2lpyae34ra2v
NEXT_PUBLIC_ONESIGNAL_APP_ID=rqsjl3cqyegwv2lpyae34ra2v
```

### Package.json - Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "prebuild": "test -f .bolt/verify-qcqbtmv.sh && bash .bolt/verify-qcqbtmv.sh || echo 'Skipping verification (deployment mode)'",
    "build": "next build",
    "start": "next start",
    "verify-project": "bash .bolt/verify-qcqbtmv.sh"
  }
}
```

---

## 📄 FICHIERS CRITIQUES

### lib/supabase.ts - Client Supabase avec Verrouillage

```typescript
import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';

// ⚠️ VERROUILLAGE ANTI-REVERT - NE PAS MODIFIER
// Projet: qcqbtmvbvipsxwjlgjvk.supabase.co
// Les IDs produits sont en TEXT (héritage: "571", "102", etc.)
const LOCKED_SUPABASE_URL = 'https://qcqbtmvbvipsxwjlgjvk.supabase.co';
const LOCKED_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

// 🛡️ PROTECTION DE SÉCURITÉ - Vérification au démarrage
if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SUPABASE_URL) {
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!envUrl.includes('qcqbtmvbvipsxwjlgjvk')) {
    throw new Error(
      `🚨 ERREUR DE SÉCURITÉ: Tentative d'utilisation d'un projet non autorisé.\n` +
      `URL détectée: ${envUrl}\n` +
      `Seul le projet qcqbtmvbvipsxwjlgjvk est autorisé.\n` +
      `INTERDICTION FORMELLE de revenir sur mcstv ou tout autre projet.`
    );
  }
}

let supabaseInstance: SupabaseClient | null = null;

function getSupabaseInstance(): SupabaseClient {
  if (!supabaseInstance) {
    if (!LOCKED_SUPABASE_URL.includes('qcqbtmvbvipsxwjlgjvk')) {
      throw new Error('🚨 ERREUR CRITIQUE: URL Supabase corrompue détectée');
    }

    supabaseInstance = createSupabaseClient(LOCKED_SUPABASE_URL, LOCKED_SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
    });
  }
  return supabaseInstance;
}

export const supabase = getSupabaseInstance();
export function createClient() {
  return getSupabaseInstance();
}

// Types globaux
export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  regular_price: number | null;
  sale_price: number | null;
  stock_quantity: number | null;
  stock_status: string;
  image_url: string | null;
  gallery_images?: string[] | null;
  attributes: any;
  variations: any;
  is_featured?: boolean;
  is_diamond?: boolean;
  created_at: string;
  updated_at: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  parent_id: string | null;
  display_order: number;
  is_visible: boolean;
  meta_title: string | null;
  meta_description: string | null;
  seo_keywords: string | null;
  created_at: string;
};

export type Profile = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  wallet_balance: number;
  created_at: string;
  is_admin?: boolean;
};
```

### lib/utils.ts - Utilitaires

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function decodeHtmlEntities(text: string | null | undefined): string {
  if (!text) return '';

  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#039;': "'",
    '&nbsp;': ' ',
  };

  return text.replace(/&[a-z0-9#]+;/gi, (match) => entities[match] || match);
}
```

### app/layout.tsx - Layout Racine

```typescript
import './globals.css';
import type { Metadata } from 'next';
import { Pangolin } from 'next/font/google';
import { LayoutWrapper } from '@/components/layout-wrapper';

const pangolin = Pangolin({ weight: '400', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'La Boutique de Morgane',
  description: 'La boutique mode et lifestyle de Morgane',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={pangolin.className}>
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  );
}
```

### types/product.ts - Types TypeScript

```typescript
export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  short_description: string | null;
  price: number;
  regular_price: number;
  sale_price: number | null;
  stock_quantity: number;
  stock_status: string;
  sku: string | null;
  featured: boolean;
  visible: boolean;
  image_url: string | null;
  gallery_images: string[] | null;
  category_ids: string[] | null;
  is_diamond: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parent_id: string | null;
  image_url: string | null;
  display_order: number;
  meta_title: string | null;
  meta_description: string | null;
  seo_keywords: string | null;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}
```

---

## 🛣️ ROUTES API

### API Routes Structure

```
app/api/
├── mondial-relay/
│   └── search/route.ts          # Recherche points relais Mondial Relay
├── paypal/
│   ├── create-order/route.ts    # Création commande PayPal
│   └── capture-order/route.ts   # Capture paiement PayPal
├── storage/
│   └── upload/route.ts          # Upload fichier + insertion table media
└── stripe/
    ├── create-checkout-session/route.ts  # Session checkout Stripe
    └── webhook/route.ts                  # Webhook Stripe (événements)
```

### app/api/storage/upload/route.ts - Upload Média

**Fonction**: Upload fichier vers Supabase Storage + insertion automatique dans table `media`

**Buckets supportés**:
- `product-images` (dossier: `products/`)
- `category-images` (dossier: `categories/`)

**Processus**:
1. Réception fichier via FormData
2. Upload vers Supabase Storage avec nom unique
3. Génération URL publique
4. Insertion dans table `media` avec métadonnées
5. Retour URL publique au client

**Sécurité**: VERROUILLÉ sur projet qcqbtmv

### app/api/stripe/webhook/route.ts - Webhook Stripe

**Événements écoutés**:
- `checkout.session.completed` → Création commande
- `payment_intent.succeeded` → Mise à jour statut paid
- `payment_intent.payment_failed` → Mise à jour statut failed

**Signature**: Vérifie la signature Stripe pour éviter les injections

---

## 💾 SCHÉMA DE BASE DE DONNÉES

### Tables Principales

#### profiles
```sql
id: uuid PRIMARY KEY (auth.users)
email: text
first_name: text
last_name: text
phone: text
birth_date: date
wallet_balance: numeric(10,2) DEFAULT 0
loyalty_points: integer DEFAULT 0
total_spent: numeric(10,2) DEFAULT 0
referral_code: text UNIQUE
referred_by: uuid (FK profiles)
is_admin: boolean DEFAULT false
avatar_url: text
created_at: timestamptz
```

**RLS**: Les utilisateurs voient uniquement leur profil, admins voient tout.

#### products
```sql
id: text PRIMARY KEY (format WordPress: "571")
name: text NOT NULL
slug: text UNIQUE NOT NULL
description: text
short_description: text
regular_price: numeric(10,2)
sale_price: numeric(10,2)
stock_quantity: integer
stock_status: text DEFAULT 'instock'
type: text DEFAULT 'simple'
image_url: text
gallery_images: text[]
attributes: jsonb
variations: jsonb
is_featured: boolean DEFAULT false
is_diamond: boolean DEFAULT false
is_variable_product: boolean DEFAULT false
created_at: timestamptz
updated_at: timestamptz
```

**RLS**: Lecture publique, écriture admin uniquement.

#### categories
```sql
id: text PRIMARY KEY
name: text NOT NULL
slug: text UNIQUE NOT NULL
description: text
image_url: text
parent_id: text (FK categories)
display_order: integer DEFAULT 0
is_visible: boolean DEFAULT true
meta_title: text
meta_description: text
seo_keywords: text
created_at: timestamptz
updated_at: timestamptz
```

**RLS**: Lecture publique des catégories visibles, écriture admin.

#### orders
```sql
id: uuid PRIMARY KEY
user_id: uuid (FK profiles)
status: text DEFAULT 'pending'
payment_method: text
payment_status: text DEFAULT 'pending'
shipping_method: text
shipping_address: jsonb
billing_address: jsonb
items: jsonb
subtotal: numeric(10,2)
shipping_cost: numeric(10,2)
tax_amount: numeric(10,2)
discount_amount: numeric(10,2)
total_amount: numeric(10,2)
coupon_code: text
notes: text
stripe_session_id: text
stripe_payment_intent_id: text
paypal_order_id: text
created_at: timestamptz
updated_at: timestamptz
```

**RLS**: Utilisateur voit ses commandes, admin voit tout.

#### media
```sql
id: uuid PRIMARY KEY
filename: text NOT NULL
file_path: text NOT NULL
url: text NOT NULL
bucket_name: text NOT NULL
file_size: integer
mime_type: text
width: integer
height: integer
is_optimized: boolean DEFAULT false
usage_count: integer DEFAULT 0
is_orphan: boolean DEFAULT false
created_at: timestamptz
```

**RLS**: Lecture publique (anon + authenticated), écriture admin.

#### unified_media (VUE)
```sql
CREATE OR REPLACE VIEW unified_media AS
SELECT
  id,
  url,
  filename,
  file_size,
  mime_type,
  created_at,
  'media_table' as source
FROM media
ORDER BY created_at DESC;
```

**Usage**: Composants MediaLibrary et admin/media utilisent cette vue.

### Tables Système Fidélité

#### loyalty_rewards
```sql
id: uuid PRIMARY KEY
name: text NOT NULL
description: text
points_required: integer NOT NULL
reward_type: text NOT NULL
reward_value: numeric(10,2)
is_active: boolean DEFAULT true
```

#### loyalty_transactions
```sql
id: uuid PRIMARY KEY
user_id: uuid (FK profiles)
points: integer NOT NULL
transaction_type: text NOT NULL
description: text
order_id: uuid (FK orders)
created_at: timestamptz
```

### Tables Gamification

#### wheel_games
```sql
id: uuid PRIMARY KEY
user_id: uuid (FK profiles)
prize_type: text NOT NULL
prize_value: numeric(10,2)
is_claimed: boolean DEFAULT false
created_at: timestamptz
```

#### scratch_cards
```sql
id: uuid PRIMARY KEY
user_id: uuid (FK profiles)
prize_type: text NOT NULL
prize_value: numeric(10,2)
is_scratched: boolean DEFAULT false
is_claimed: boolean DEFAULT false
created_at: timestamptz
```

### Tables Contenu

#### news
```sql
id: uuid PRIMARY KEY
title: text NOT NULL
slug: text UNIQUE NOT NULL
content: text
excerpt: text
image_url: text
author_id: uuid (FK profiles)
category_id: uuid (FK news_categories)
status: text DEFAULT 'draft'
published_at: timestamptz
meta_title: text
meta_description: text
created_at: timestamptz
```

#### looks
```sql
id: uuid PRIMARY KEY
title: text NOT NULL
description: text
image_url: text NOT NULL
product_ids: text[]
is_featured: boolean DEFAULT false
like_count: integer DEFAULT 0
created_at: timestamptz
```

#### guestbook_entries
```sql
id: uuid PRIMARY KEY
user_id: uuid (FK profiles)
rating: integer CHECK (rating BETWEEN 1 AND 5)
message: text NOT NULL
images: text[]
is_approved: boolean DEFAULT false
is_featured: boolean DEFAULT false
admin_reply: text
created_at: timestamptz
```

---

## 🎯 SYSTÈMES CLÉS

### 1. Système d'Authentification

**Implémentation**: Supabase Auth (email/password)

**Contexte**: `context/AuthContext.tsx`
- Gestion session utilisateur
- Auto-refresh token
- Persistance localStorage

**Protection routes admin**:
```typescript
// Vérification is_admin dans tous les composants admin/
const { data: profile } = await supabase
  .from('profiles')
  .select('is_admin')
  .eq('id', user.id)
  .single();

if (!profile?.is_admin) {
  redirect('/');
}
```

### 2. Système de Panier

**Contexte**: `context/CartContext.tsx`

**Fonctionnalités**:
- Ajout/suppression articles
- Gestion quantités
- Support variations produits
- Calcul sous-total automatique
- Persistance localStorage
- Application coupons de réduction

**Structure article**:
```typescript
{
  productId: string;
  variationId?: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
  attributes?: Array<{name: string, option: string}>;
}
```

### 3. Système de Variations Produits

**Composant**: `components/ProductVariationSelector.tsx`

**Fix #31**: Ajout fonction `safeString()` pour gérer objets dans attributs

**Types de variations**:
- **Couleur**: Affichage pastilles colorées
- **Taille**: Tri automatique (XS, S, M, L, XL, XXL, XXXL)
- **Autres**: Boutons standards

**Disponibilité**: Grise les options en rupture de stock

### 4. Système Média Unifié

**Vue**: `unified_media`
**Composants**:
- `components/MediaLibrary.tsx` - Sélecteur média
- `app/admin/media/page.tsx` - Gestion médiathèque

**Flux upload**:
1. Sélection fichier
2. Conversion WebP automatique (90% qualité)
3. Upload via `/api/storage/upload`
4. Insertion table `media`
5. Rafraîchissement automatique composant
6. Affichage immédiat dans grille

**Buckets**:
- `product-images/products/` - Images produits
- `category-images/categories/` - Images catégories

### 5. Système de Fidélité

**Tables**: `loyalty_rewards`, `loyalty_transactions`

**Hooks**: `hooks/use-wallet-balance.ts`, `hooks/use-gift-progress.ts`

**Calcul points**:
- 1€ dépensé = 1 point
- Paliers de récompenses configurables
- Bonus parrainage
- Barre de progression visuelle

### 6. Système de Jeux

**Composants**:
- `WheelGame.tsx` - Roue de la chance
- `ScratchCardGame.tsx` - Jeu à gratter

**Admin**: Gestion des lots dans `admin/wheel/` et `admin/scratch-cards/`

**Récompenses**: Coupons, réductions, cadeaux

### 7. Système de Paiement

**Providers**:
- **Stripe** (principal) - Checkout Session + Webhooks
- **PayPal** - Alternative paiement

**Flux Stripe**:
1. Création session checkout (`/api/stripe/create-checkout-session`)
2. Redirection vers Stripe Checkout
3. Webhook `checkout.session.completed`
4. Création commande dans table `orders`
5. Redirection `/checkout/confirmation?session_id=xxx`

**Webhook sécurisé**: Vérification signature Stripe obligatoire

### 8. Système de Livraison

**Provider**: Mondial Relay

**Route API**: `/api/mondial-relay/search`

**Composant**: `components/MondialRelaySelector.tsx`

**Fonctionnalités**:
- Recherche par code postal
- Affichage points relais sur carte
- Sélection point préféré
- Stockage adresse livraison

---

## 📦 MIGRATIONS SUPABASE

### Migrations Critiques

**Total**: 73 migrations (du 2026-01-04 au 2026-01-08)

#### Migration initiale (2026-01-04)
```
20260104165847_create_ecommerce_schema.sql
20260104190939_create_profiles_and_addresses.sql
20260104191822_create_media_and_product_management_tables_v2.sql
20260104193123_create_informational_pages_tables.sql
20260104203045_create_news_system.sql
```

#### Corrections RLS (2026-01-06 à 2026-01-07)
```
20260106095816_fix_categories_rls_policies.sql
20260106095840_allow_authenticated_category_management.sql
20260107190148_fix_home_categories_schema.sql
20260107202912_cleanup_temporary_rls_policies.sql
20260107210000_fix_products_public_visibility.sql
```

#### Systèmes avancés (2026-01-08)
```
20260108080347_20260108_loyalty_system_tables_only.sql
20260108080424_20260108_loyalty_system_rls_policies.sql
20260108081003_20260108_upgrade_guestbook_livre_dor.sql
20260108081038_20260108_create_returns_system.sql
20260108081109_20260108_upgrade_looks_system_complete.sql
20260108093658_20260108090000_add_stripe_columns_to_orders.sql
20260108105801_20260108110000_create_games_system_corrected.sql
20260108120000_create_unified_media_view.sql (VUE UNIFIÉE)
```

### Format Migrations

Toutes les migrations suivent ce format:

```sql
/*
  # Titre de la migration

  1. Description
    - Changement 1
    - Changement 2

  2. Nouvelles Tables
    - `table_name`
      - `column1` (type, description)
      - `column2` (type, description)

  3. Sécurité
    - Enable RLS on `table_name`
    - Policy "Description policy" (SELECT/INSERT/UPDATE/DELETE)

  4. Notes
    - Note importante 1
    - Note importante 2
*/

-- SQL statements with IF EXISTS/IF NOT EXISTS
CREATE TABLE IF NOT EXISTS ...
ALTER TABLE ... ENABLE ROW LEVEL SECURITY;
CREATE POLICY ... ON ... FOR ... TO ... USING (...);
```

---

## 🔐 RÈGLES DE SÉCURITÉ RLS

### Principes

1. **Toutes les tables ont RLS activé**: `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
2. **Pas de `USING (true)`**: Chaque policy vérifie authentification/ownership
3. **4 policies par table**: SELECT, INSERT, UPDATE, DELETE séparées
4. **`auth.uid()`**: Toujours utilisé (jamais `current_user`)

### Exemples de Policies

**Profiles (lecture propre profil)**:
```sql
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);
```

**Products (lecture publique, écriture admin)**:
```sql
CREATE POLICY "Anyone can view published products"
  ON products FOR SELECT
  TO anon, authenticated
  USING (status = 'publish');

CREATE POLICY "Admins can manage products"
  ON products FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );
```

**Orders (ownership strict)**:
```sql
CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());
```

---

## 🎨 DESIGN SYSTEM

### Couleurs Principales

```css
/* Couleurs brand */
--gold-primary: #b8933d
--gold-hover: #a07c2f
--gold-light: #d4af37

/* Status */
--success: #16A34A
--warning: #EAB308
--error: #DC2626
--info: #2563EB
```

### Composants shadcn/ui (58 composants)

Tous les composants UI sont dans `components/ui/`:
- Formulaires: Button, Input, Textarea, Select, Checkbox, Radio, Switch
- Navigation: Tabs, Breadcrumb, Pagination, NavigationMenu
- Feedback: Alert, Toast, Dialog, AlertDialog, Progress
- Layout: Card, Separator, Accordion, Collapsible
- Overlays: Sheet, Drawer, Popover, HoverCard, Tooltip
- Data: Table, Calendar, Chart
- Et bien d'autres...

### Police

**Font**: Pangolin (Google Fonts, weight 400)

---

## 📊 STATISTIQUES PROJET

- **Composants React**: 90+
- **Routes API**: 6
- **Pages**: 72
- **Migrations**: 73
- **Scripts**: 45
- **Hooks personnalisés**: 9
- **Contextes**: 3
- **Stores Zustand**: 2
- **Taille bundle First Load JS**: 79.5 kB (partagé)

---

## 🚀 DÉPLOIEMENT

### Build Production

```bash
npm run build
```

**Pré-build**: Vérifie que le projet est bien sur qcqbtmv via `.bolt/verify-qcqbtmv.sh`

### Variables Vercel

Toutes les variables d'environnement du `.env` doivent être configurées dans Vercel.

### Webhooks

**Stripe webhook endpoint**: `https://[domain]/api/stripe/webhook`
- Configurer dans Stripe Dashboard
- Signer avec Webhook Secret

---

## 📝 NOTES IMPORTANTES

1. **IDs en TEXT**: Ne jamais changer en UUID, compatibilité WordPress
2. **Verrouillage qcqbtmv**: Protection multi-niveaux contre revert
3. **RLS strict**: Aucune exception, toutes les tables protégées
4. **Conversion WebP**: Automatique sur tous les uploads
5. **Vue unified_media**: Utiliser dans tous les composants média
6. **Fix #31**: Fonction `safeString()` dans ProductVariationSelector
7. **Auth persistante**: Session localStorage + auto-refresh
8. **Paiements LIVE**: Stripe et PayPal en production

---

## 🤝 COLLABORATION IA

Ce blueprint est conçu pour être partagé avec d'autres IA (Gemini, GPT, Claude).

**Format**: Markdown structuré avec code blocks syntaxés

**Usage**: Comprendre rapidement l'architecture complète du projet

**Mise à jour**: À regénérer après modifications majeures

---

**Fin du Blueprint - Version 2026-01-08**
