# La Boutique de Morgane

Site e-commerce Next.js avec Supabase.

## Stack Technique

- **Framework**: Next.js 13.5.1 (App Router)
- **Base de données**: Supabase PostgreSQL
- **Authentification**: Supabase Auth
- **Styling**: TailwindCSS + shadcn/ui
- **Paiements**: Stripe + PayPal
- **Livraison**: Mondial Relay

## Installation

```bash
npm install
```

## Configuration

Créer un fichier `.env` à partir de `.env.example` :

```bash
cp .env.example .env
```

Remplir toutes les variables d'environnement requises.

## Développement

```bash
npm run dev
```

## Build Production

```bash
npm run build
npm start
```

## Déploiement

Le projet est configuré pour Vercel. Toutes les variables d'environnement doivent être configurées dans les settings Vercel.

## License

Propriétaire - La Boutique de Morgane
