# 🔍 RAPPORT D'ANALYSE DE NETTOYAGE - BASE DE DONNÉES
## Projet: qcqbtmvbvipsxwjlgjvk
**Date**: 2026-01-10
**Tables totales**: 97

---

## 📊 RÉSUMÉ EXÉCUTIF

### Résultats de l'analyse

- ✅ **Tables activement utilisées**: 81 tables
- ⚠️ **Tables peu/pas utilisées**: 11 tables
- ❌ **TABLES À SUPPRIMER (orphelines)**: 5 tables
- 🔄 **Tables dupliquées détectées**: 3 paires

### 💰 Gain estimé
- **Nettoyage des orphelines**: Réduction de ~15-20% des tables
- **Simplification RLS**: -15 politiques inutiles
- **Performance**: Réduction des temps de requêtes

---

## ❌ TABLES À SUPPRIMER IMMÉDIATEMENT

### 1. Tables complètement orphelines (0 références)

| Table | Refs Code | Refs Migrations | Statut | Action |
|-------|-----------|-----------------|--------|--------|
| **customer_reviews_v2** | 0 | 0 | ORPHELINE | ❌ SUPPRIMER |
| **daily_checkins** | 0 | 0 | ORPHELINE | ❌ SUPPRIMER |
| **diamond_finds** | 0 | 0 | ORPHELINE | ❌ SUPPRIMER |
| **game_participations** | 0 | 0 | ORPHELINE | ❌ SUPPRIMER |
| **scratch_card_campaigns** | 0 | 0 | ORPHELINE | ❌ SUPPRIMER |
| **video_shorts** | 0 | 0 | ORPHELINE | ❌ SUPPRIMER |
| **wheel_campaigns** | 0 | 0 | ORPHELINE | ❌ SUPPRIMER |

**TOTAL**: 7 tables orphelines à supprimer

---

## 🔄 TABLES DUPLIQUÉES OU REDONDANTES

### Système de reviews (3 tables pour la même chose!)
- ✅ **customer_reviews** (5 refs code, 25 migrations) → GARDER
- ⚠️ **customer_reviews_v2** (0 refs) → SUPPRIMER
- ⚠️ **reviews** (0 refs code, 36 migrations) → PROBABLEMENT SUPPRIMER

### Système de diamants cachés (3 tables similaires)
- ✅ **hidden_diamonds** (3 refs code) → GARDER
- ⚠️ **diamond_discoveries** (1 ref code) → FUSIONNER?
- ⚠️ **diamond_findings** (0 refs code) → SUPPRIMER
- ❌ **diamond_finds** (0 refs) → SUPPRIMER

### Système de référencement (confusion)
- ✅ **referral_codes** (3 refs code) → GARDER
- ✅ **referral_uses** (1 ref code) → GARDER
- ⚠️ **referral_usage** (0 refs code) → SUPPRIMER
- ⚠️ **referral_rewards** (0 refs) → SUPPRIMER

### Système de coupons (trop de tables!)
- ✅ **coupons** (16 refs code) → GARDER
- ✅ **user_coupons** (8 refs code) → GARDER
- ⚠️ **coupon_types** (0 refs code) → PEUT-ÊTRE FUSIONNER avec coupons
- ⚠️ **coupon_usage** (1 ref code) → VÉRIFIER si utile
- ⚠️ **cross_coupons** (0 refs code) → SUPPRIMER
- ⚠️ **cross_platform_coupons** (0 refs code) → SUPPRIMER

### Système de live streaming (doublon chat)
- ✅ **live_chat_messages** (3 refs code) → GARDER
- ⚠️ **live_stream_chat_messages** (0 refs code) → SUPPRIMER (doublon)
- ⚠️ **live_stream_products** (0 refs code) → SUPPRIMER (existe live_shared_products)

### Système loyalty (doublon)
- ✅ **loyalty_transactions** (3 refs code) → GARDER
- ⚠️ **loyalty_transactions_v2** (0 refs) → SUPPRIMER

---

## ⚠️ TABLES PEU UTILISÉES (À VÉRIFIER)

| Table | Refs Code | Refs Migrations | Recommandation |
|-------|-----------|-----------------|----------------|
| **coupon_usage** | 1 | 0 | Vérifier si vraiment utilisée |
| **delivery_batch_items** | 0 | 12 | Migration créée mais jamais codée |
| **live_attendance** | 0 | 3 | Pas implémenté |
| **live_recordings** | 0 | 7 | Pas implémenté |
| **live_stream_analytics** | 0 | 10 | Pas implémenté |
| **live_stream_settings** | 0 | 7 | Remplacé par obs_settings? |
| **live_stream_viewers** | 0 | 9 | Pas utilisé |
| **live_viewers** | 0 | 9 | Doublon? |
| **look_bundle_carts** | 0 | 10 | Fonctionnalité non terminée |
| **loyalty_euro_transactions** | 0 | 9 | Pas utilisé |
| **loyalty_wallet** | 0 | 10 | Pas utilisé (doublon profiles?) |
| **product_attribute_values** | 0 | 14 | Jamais codé |
| **product_images** | 0 | 17 | Remplacé par gallery_images? |
| **review_email_queue** | 0 | 7 | Pas implémenté |

---

## ✅ TABLES BIEN UTILISÉES (NE PAS TOUCHER)

### Tables critiques (fortement utilisées)
| Table | Refs Code | Refs Migrations |
|-------|-----------|-----------------|
| **profiles** | 49 | 525 |
| **products** | 54 | 201 |
| **categories** | 60 | 210 |
| **orders** | 26 | 148 |
| **coupons** | 16 | 96 |
| **guestbook_entries** | 8 | 111 |
| **open_packages** | 13 | 57 |
| **media** | 16 | 50 |

### Modules actifs et fonctionnels
- ✅ addresses, cart_items, wishlist
- ✅ home_categories, home_slides, featured_products
- ✅ news_posts, news_categories, news_post_categories
- ✅ gift_cards, gift_card_transactions
- ✅ looks, look_products
- ✅ payment_methods, shipping_methods
- ✅ product_variations, product_attributes, product_attribute_terms
- ✅ store_credits, wallet_transactions
- ✅ wheel_games, scratch_card_games, card_flip_games
- ✅ customer_reviews, return_requests
- ✅ seo_metadata

---

## 📋 ACTIONS RECOMMANDÉES PAR PRIORITÉ

### 🔴 PRIORITÉ 1 - À supprimer immédiatement (gain immédiat)
```sql
DROP TABLE IF EXISTS customer_reviews_v2 CASCADE;
DROP TABLE IF EXISTS daily_checkins CASCADE;
DROP TABLE IF EXISTS diamond_finds CASCADE;
DROP TABLE IF EXISTS game_participations CASCADE;
DROP TABLE IF EXISTS scratch_card_campaigns CASCADE;
DROP TABLE IF EXISTS video_shorts CASCADE;
DROP TABLE IF EXISTS wheel_campaigns CASCADE;
```

### 🟠 PRIORITÉ 2 - Doublons à nettoyer
```sql
-- Vérifier avant de supprimer
DROP TABLE IF EXISTS referral_usage CASCADE;
DROP TABLE IF EXISTS referral_rewards CASCADE;
DROP TABLE IF EXISTS cross_coupons CASCADE;
DROP TABLE IF EXISTS cross_platform_coupons CASCADE;
DROP TABLE IF EXISTS live_stream_chat_messages CASCADE;
DROP TABLE IF EXISTS loyalty_transactions_v2 CASCADE;
DROP TABLE IF EXISTS diamond_findings CASCADE;
```

### 🟡 PRIORITÉ 3 - Tables peu utilisées à analyser
```sql
-- Tables créées en migration mais jamais codées
-- Vérifier si elles servent avant suppression
DROP TABLE IF EXISTS delivery_batch_items CASCADE;
DROP TABLE IF EXISTS live_attendance CASCADE;
DROP TABLE IF EXISTS live_recordings CASCADE;
DROP TABLE IF EXISTS live_stream_analytics CASCADE;
DROP TABLE IF EXISTS live_stream_settings CASCADE;
DROP TABLE IF EXISTS live_stream_viewers CASCADE;
DROP TABLE IF EXISTS live_viewers CASCADE;
DROP TABLE IF EXISTS look_bundle_carts CASCADE;
DROP TABLE IF EXISTS loyalty_euro_transactions CASCADE;
DROP TABLE IF EXISTS loyalty_wallet CASCADE;
DROP TABLE IF EXISTS product_attribute_values CASCADE;
DROP TABLE IF EXISTS product_images CASCADE;
DROP TABLE IF EXISTS review_email_queue CASCADE;
DROP TABLE IF EXISTS reviews CASCADE; -- Attention, vérifier avant!
```

### 🟢 PRIORITÉ 4 - Optimisations futures
- Fusionner `diamond_discoveries` dans `hidden_diamonds`
- Fusionner `coupon_types` dans `coupons` (simplifier)
- Documenter l'usage de `coupon_usage`
- Vérifier si `live_shared_products` peut remplacer `live_stream_products`

---

## 📊 STATISTIQUES DÉTAILLÉES

### Top 10 tables les plus utilisées
1. profiles (574 références)
2. categories (270 références)
3. products (255 références)
4. orders (174 références)
5. guestbook_entries (119 références)
6. coupons (112 références)
7. open_packages (70 références)
8. home_categories (67 références)
9. media (66 références)
10. live_streams (61 références)

### Tables jamais utilisées dans le code (mais avec migrations)
- coupon_types (22 migrations, 0 code)
- guestbook_likes (36 migrations, 0 code)
- guestbook_votes (24 migrations, 0 code)
- reviews (36 migrations, 0 code)

---

## 🎯 GAIN ESTIMÉ APRÈS NETTOYAGE

### Nettoyage Priorité 1 seule
- **Tables supprimées**: 7
- **Politiques RLS**: ~15-20 en moins
- **Taille BDD**: -5 à 10%
- **Complexité**: -10%

### Nettoyage complet (P1 + P2 + P3)
- **Tables supprimées**: 28 tables (~29%)
- **Politiques RLS**: ~50-60 en moins
- **Taille BDD**: -20 à 30%
- **Complexité**: -35%
- **Maintenance**: Beaucoup plus simple!

---

## ⚠️ ATTENTION - AVANT DE SUPPRIMER

### Checklist de sécurité
1. ✅ Faire une sauvegarde complète de la BDD
2. ✅ Vérifier qu'aucune table n'a de données importantes
3. ✅ Vérifier les contraintes de clés étrangères (CASCADE)
4. ✅ Tester en dev/staging d'abord
5. ✅ Documenter les raisons de suppression
6. ✅ Prévenir l'équipe

### Tables avec données à vérifier manuellement
```sql
-- Vérifier s'il y a des données avant suppression
SELECT 'coupon_types' as table_name, COUNT(*) as rows FROM coupon_types
UNION ALL
SELECT 'reviews', COUNT(*) FROM reviews
UNION ALL
SELECT 'guestbook_votes', COUNT(*) FROM guestbook_votes;
```

---

## 📝 NOTES IMPORTANTES

### Tables avec nommage confus
- `live_chat_messages` vs `live_stream_chat_messages` → Clarifier
- `live_viewers` vs `live_stream_viewers` → Dédoublonner
- `referral_usage` vs `referral_uses` → Choisir un seul

### Fonctionnalités partiellement implémentées
- Système de live streaming: beaucoup de tables créées mais pas toutes utilisées
- Système de reviews: 3 tables différentes pour la même chose
- Système de diamants: architecture pas claire
- Système de loyalty: doublon wallet vs transactions

### Migrations à nettoyer aussi
- Beaucoup de migrations créent des tables jamais utilisées
- Certaines migrations font des ALTER TABLE sur des colonnes qui existent déjà
- Migrations de "fix" à répétition → besoin de consolidation

---

## 🚀 PROCHAINES ÉTAPES RECOMMANDÉES

1. **Valider ce rapport** avec l'équipe
2. **Exporter les données** des tables à supprimer (au cas où)
3. **Créer une migration de nettoyage Priorité 1**
4. **Tester en staging**
5. **Appliquer en production**
6. **Documenter les changements**
7. **Planifier P2 et P3** pour un prochain sprint

---

## 📞 CONTACT

Pour toute question sur ce rapport:
- Vérifier les fichiers dans `supabase/migrations/`
- Grep dans le code: `grep -r "\.from('nom_table')"`
- Consulter la documentation Supabase

---

**FIN DU RAPPORT**
*Rapport généré automatiquement - Vérifier avant application*
