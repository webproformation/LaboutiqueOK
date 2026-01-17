# TEST SYSTÈME JEUX - 2026-01-08

## État des tables

✅ `wheel_games` - Créée et opérationnelle
✅ `scratch_card_games` - Créée et opérationnelle
✅ `game_plays` - Créée et opérationnelle

## Tests SQL directs

✅ INSERT dans scratch_card_games : OK
✅ DELETE dans scratch_card_games : OK
✅ Les données sont bien stockées en JSONB

## Problème identifié

Cache du schéma Supabase côté client JavaScript.

**Cause** : Après la création de nouvelles tables via migration, le client Supabase JS met à jour son cache avec un délai de 0-5 minutes.

**Solution** : Attendre quelques minutes ou redémarrer les services Supabase (via dashboard).

## Pages admin à tester

1. **Admin Roue de la chance** : `/admin/wheel`
   - Créer un nouveau jeu
   - Ajouter des segments (min 4)
   - Associer des coupons
   - Définir les probabilités (total 100%)
   - Dates de début/fin (format date HTML5)
   - Activer le jeu

2. **Admin Cartes à gratter** : `/admin/scratch-cards`
   - Créer un nouveau jeu
   - Ajouter des prix
   - Associer des coupons
   - Définir les probabilités (total 100%)
   - Dates de début/fin
   - Personnaliser les couleurs
   - Activer le jeu

## Vérification après 5 minutes

Si le cache est toujours problématique :

```bash
# Option 1 : Forcer le refresh (dashboard Supabase)
# Settings → API → Restart API

# Option 2 : Attendre la synchronisation auto (5-10 min max)

# Option 3 : Clear cache local
rm -rf .next
npm run dev
```

## Format des dates

Les composants utilisent `<input type="date">` qui envoie automatiquement au format ISO `YYYY-MM-DD`.

Le backend transforme en `timestamptz` via :
```javascript
start_date: formData.start_date || null
// "2026-01-15" → PostgreSQL timestamptz automatique
```

✅ **Aucune modification nécessaire dans le code**

## Prochaines étapes

1. Attendre 2-3 minutes pour le cache Supabase
2. Tester `/admin/wheel`
3. Tester `/admin/scratch-cards`
4. Créer un jeu complet avec coupons
5. Vérifier l'affichage frontend

## État du build

✅ Build production : 72 pages OK
✅ 0 erreur de compilation
✅ Tables créées en base de données
⏳ Cache Supabase en cours de synchronisation
