# Guide de Déploiement sur Vercel

## Étape 1 : Supprimer l'ancien projet Vercel

1. Allez sur https://vercel.com/dashboard
2. Trouvez votre ancien projet
3. **Settings** → **General** → Tout en bas : **Delete Project**
4. OU : **Settings** → **Domains** → Supprimez tous les domaines

## Étape 2 : Créer un nouveau déploiement

### A) Via GitHub (Recommandé)

1. **Pushez votre code sur GitHub** si ce n'est pas déjà fait
2. Allez sur https://vercel.com/new
3. **Import Git Repository**
4. Sélectionnez votre repo GitHub
5. Vercel détecte automatiquement Next.js

### B) Déploiement direct

```bash
# Dans votre projet local
npm install -g vercel

# Déployez
vercel

# Suivez les instructions
# Quand il demande le nom du projet : laboutiquedemorgane
```

## Étape 3 : Configurer les variables d'environnement

Dans Vercel Dashboard → **Settings** → **Environment Variables**, ajoutez :

```
NEXT_PUBLIC_WORDPRESS_API_URL=https://wp.laboutiquedemorgane.com/wp-json
WORDPRESS_API_URL=https://wp.laboutiquedemorgane.com/wp-json
WOOCOMMERCE_CONSUMER_KEY=ck_VOTRE_CLE
WOOCOMMERCE_CONSUMER_SECRET=cs_VOTRE_SECRET
WOOCOMMERCE_URL=https://wp.laboutiquedemorgane.com
NEXT_PUBLIC_SUPABASE_URL=votre_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_supabase
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key
```

Copiez TOUTES les variables de votre fichier `.env`

## Étape 4 : Ajouter votre domaine

1. **Settings** → **Domains**
2. Ajoutez `laboutiquedemorgane.com`
3. Ajoutez `www.laboutiquedemorgane.com`
4. Vercel vous donnera des instructions DNS

## Étape 5 : Configuration DNS finale

Dans votre gestionnaire DNS (celui qui gère laboutiquedemorgane.com) :

```
Type    Nom    Valeur
CNAME   www    cname.vercel-dns.com
A       @      76.76.21.21  (IP Vercel)
```

**OU** suivez exactement les instructions DNS que Vercel vous donne.

## Vérification

- Attendez 5-30 minutes pour la propagation DNS
- Testez : https://laboutiquedemorgane.com
- Vérifiez : https://www.laboutiquedemorgane.com

## Avantages de Vercel

- ✅ Gratuit jusqu'à 100GB de bande passante
- ✅ CDN mondial automatique
- ✅ SSL automatique
- ✅ Déploiement automatique à chaque commit
- ✅ Preview deployments pour tester
- ✅ Performances optimales pour Next.js

## Architecture finale

```
laboutiquedemorgane.com (Frontend Next.js)
    ↓ Hébergé sur Vercel
    ↓
    ↓ API REST
    ↓
wp.laboutiquedemorgane.com (WordPress/WooCommerce)
    ↓ Hébergé sur o2switch
    ↓ Base MySQL

+ Supabase (Base PostgreSQL)
```

## Alternative : Export statique sur o2switch

Si vous voulez ABSOLUMENT tout sur o2switch :

```bash
# Modifiez next.config.js
module.exports = {
  output: 'export',
  images: {
    unoptimized: true
  }
}

# Buildez
npm run build

# Uploadez le dossier 'out' vers o2switch
```

**Limitations export statique :**
- ❌ Pas de Server-Side Rendering
- ❌ Pas d'API Routes
- ❌ Pas d'optimisation d'images automatique
- ❌ Performances réduites
