# Guide Rapide: Configuration Webhook Supabase ↔ Vercel

## 🎯 Objectif

Vider automatiquement le cache Vercel dès qu'une donnée change dans Supabase.

## ⚡ Configuration Express (5 minutes)

### 1️⃣ Générer un secret

Ouvrez un terminal et exécutez:
```bash
openssl rand -base64 32
```

Copiez le résultat (ex: `8f3d2e1a9b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e`)

### 2️⃣ Ajouter sur Vercel

1. Allez sur https://vercel.com → Votre projet
2. **Settings** → **Environment Variables**
3. Ajoutez:
   - Name: `WEBHOOK_SECRET`
   - Value: *Collez le secret de l'étape 1*
   - Cochez: Production, Preview, Development
4. **Save**
5. **IMPORTANT**: Redéployez l'application

### 3️⃣ Configurer dans Supabase

1. Allez sur https://supabase.com → Votre projet
2. **Database** → **Webhooks** → **Create a new hook**
3. Remplissez:
   - **Name**: `revalidate_cache_vercel`
   - **Table**: Sélectionnez les tables importantes (`user_profiles`, `home_slides`, `orders`, etc.)
   - **Events**: ☑️ INSERT, ☑️ UPDATE, ☑️ DELETE
   - **Type**: HTTP Request
   - **Method**: POST
   - **URL**: `https://www.laboutiquedemorgane.com/api/revalidate`
   - **HTTP Headers**: Cliquez sur **+ Add header**
     - Name: `x-webhook-secret`
     - Value: *Collez le même secret qu'à l'étape 1*
4. **Create Webhook**

### 4️⃣ Tester

1. Dans Supabase: **Database** → **Webhooks** → Votre webhook → **Test**
2. Vous devez voir: ✅ `200 OK` avec `{"revalidated": true}`

## ✅ Résultat

Maintenant:
- PostgREST se recharge automatiquement (déjà fait avec le trigger DDL)
- Cache Vercel se vide automatiquement dès qu'une donnée change
- Plus besoin de commandes manuelles!

## 📚 Documentation complète

Voir le fichier `WEBHOOK_SUPABASE_VERCEL_SETUP.md` pour tous les détails et options avancées.
