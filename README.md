# La Boutique de Morgane - Application Live Shopping

Une application Next.js moderne pour le live shopping connectée à WordPress/WooCommerce via GraphQL.

## Fonctionnalités

- 🛍️ **Catalogue de produits** : Affichage des produits depuis WooCommerce
- 📹 **Live Shopping interactif** : Lecteur vidéo avec affichage automatique des produits selon la timeline
- 🛒 **Panier intelligent** : Gestion du panier avec localStorage
- 📱 **Design responsive** : Optimisé mobile-first
- ⚡ **Performance** : Architecture moderne avec Next.js 13

## Prérequis

- Node.js 16+ installé
- Un site WordPress avec:
  - WooCommerce
  - WPGraphQL
  - WPGraphQL for WooCommerce
  - ACF Pro (Advanced Custom Fields)
  - WPGraphQL for ACF
  - CPT UI (pour le custom post type "Live")

## Installation

1. **Cloner le projet**
   ```bash
   git clone <votre-repo>
   cd mon-shop-live
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configurer les variables d'environnement**

   Modifiez le fichier `.env` :
   ```env
   NEXT_PUBLIC_WORDPRESS_API_URL=https://votre-site-wordpress.com/graphql
   ```

   Remplacez `https://votre-site-wordpress.com/graphql` par l'URL de votre API WordPress GraphQL.

## Configuration WordPress

### 1. Champs ACF pour les Lives

Créez un groupe de champs "Config Live" assigné au post type "Live" avec :

- **timeline** (Répéteur) :
  - `time_start` (Nombre, en secondes)
  - `time_end` (Nombre, en secondes)
  - `product_associated` (Relation -> Produit)

### 2. Champs ACF utilisateur (optionnel)

Pour la fonctionnalité "Colis Ouvert", créez un groupe "Profil Client" :

- `statut_colis` (Select : ouvert/fermé)
- `date_ouverture` (Date picker)
- `montant_economise` (Nombre)

## Développement

Lancer le serveur de développement :

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## Build

Compiler le projet pour la production :

```bash
npm run build
```

Lancer la version de production :

```bash
npm start
```

## Structure du projet

```
├── app/
│   ├── page.tsx              # Page catalogue (accueil)
│   ├── cart/                 # Page panier
│   ├── live/                 # Page live shopping
│   └── product/[slug]/       # Page produit dynamique
├── components/
│   ├── Header.tsx            # En-tête avec navigation
│   ├── ProductCard.tsx       # Carte produit
│   ├── ApolloProvider.tsx    # Wrapper Apollo Client
│   └── ui/                   # Composants UI (shadcn)
├── context/
│   └── CartContext.tsx       # Contexte global du panier
├── lib/
│   ├── apollo-client.ts      # Configuration Apollo
│   ├── queries.ts            # Requêtes GraphQL
│   └── utils.ts              # Fonctions utilitaires
└── types/
    └── index.ts              # Types TypeScript
```

## Utilisation

### Créer un Live

1. Dans WordPress, créez un nouveau "Live"
2. Ajoutez l'URL de la vidéo YouTube dans le champ prévu
3. Configurez la timeline avec les timestamps et produits associés
4. Publiez le live

### Gérer les produits

Les produits sont gérés directement dans WooCommerce. Toute modification sera automatiquement reflétée dans l'application via l'API GraphQL.

## Déploiement

### Vercel (Recommandé)

1. Push votre code sur GitHub
2. Importez le projet sur [Vercel](https://vercel.com)
3. Configurez la variable d'environnement :
   - `NEXT_PUBLIC_WORDPRESS_API_URL`
4. Déployez !

### CORS WordPress

N'oubliez pas de configurer les CORS sur WordPress :

1. Installez le plugin "WPGraphQL CORS"
2. Ajoutez l'URL de votre site Vercel dans les "Allowed Origins"

## Technologies

- **Next.js 13** : Framework React avec App Router
- **TypeScript** : Typage statique
- **Tailwind CSS** : Styling utilitaire
- **shadcn/ui** : Composants UI accessibles
- **Apollo Client** : Client GraphQL
- **React Player** : Lecteur vidéo
- **Sonner** : Toast notifications

## Support

Pour toute question, consultez la documentation ou contactez le développeur.
