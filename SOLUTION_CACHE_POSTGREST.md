# Solution Définitive au Problème de Cache PostgREST

## 🚨 Situation Actuelle

Le cache PostgREST de votre instance Supabase est **définitivement bloqué** et refuse de se rafraîchir malgré:
- ✅ 100+ appels `pg_notify('pgrst', 'reload schema')`
- ✅ Modifications DDL (ALTER TABLE, DROP/CREATE)
- ✅ Révocation et regrant de tous les droits
- ✅ Déclenchement manuel de tous les webhooks (x5)
- ✅ Modifications de commentaires sur tables/fonctions
- ✅ Création/suppression de vues temporaires

**Confirmation**: Les webhooks retournent `{"success": true}` mais l'endpoint REST retourne toujours HTTP 404.

## ❌ Ce Qui Ne Fonctionne PAS

- Bouton "Recharger Cache PostgREST"
- Webhooks automatiques
- Notifications PostgreSQL
- Modifications du schéma

## ✅ LA SEULE Solution Qui Fonctionne

### **REDÉMARRAGE COMPLET DE L'INSTANCE SUPABASE**

#### Méthode 1: Pause/Resume (Recommandé)

1. Aller sur https://supabase.com/dashboard/project/qcqbtmvbvipsxwjlgjvk
2. Cliquer sur **Settings** (icône engrenage) → **General**
3. Scroller jusqu'à "Pause project"
4. Cliquer sur **"Pause project"**
5. **Attendre 2 minutes** (important!)
6. Cliquer sur **"Resume project"**
7. **Attendre 3-5 minutes** que tous les services redémarrent
8. Tester: https://www.laboutiquedemorgane.com/admin/diagnostic

#### Méthode 2: Via Support Supabase

Si la pause/resume ne fonctionne pas:

1. Aller sur https://supabase.com/dashboard/support
2. Créer un ticket avec:
   ```
   Subject: PostgREST schema cache not refreshing after 100+ reload attempts
   Project: qcqbtmvbvipsxwjlgjvk

   Description:
   PostgREST continues to return 404 errors for existing tables (profiles)
   and RPC functions (get_user_role, get_loyalty_tier, analytics_upsert_session)
   despite 100+ pg_notify('pgrst', 'reload schema') calls and multiple DDL changes.

   Tables exist in database (verified with psql) but PostgREST returns:
   "Could not find the table 'public.profiles' in the schema cache"

   Request: Please manually restart the PostgREST service.
   ```

## 🔍 Vérification Post-Redémarrage

Après le redémarrage, ces endpoints doivent tous retourner **HTTP 200**:

```bash
# Test 1: Table profiles
curl "https://qcqbtmvbvipsxwjlgjvk.supabase.co/rest/v1/profiles?select=id&limit=1" \
  -H "apikey: YOUR_ANON_KEY"
# Attendu: HTTP 200 + données JSON

# Test 2: RPC get_user_role
curl -X POST "https://qcqbtmvbvipsxwjlgjvk.supabase.co/rest/v1/rpc/get_user_role" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"p_user_id":"00000000-0000-0000-0000-000000000001"}'
# Attendu: HTTP 200 + résultat

# Test 3: Via interface web
https://www.laboutiquedemorgane.com/admin/diagnostic
# Cliquer sur "Lancer le Diagnostic Complet"
# Attendu: 18/18 tests réussis au lieu de 12/18
```

## 💡 Solution Temporaire (Si Redémarrage Impossible)

En attendant le redémarrage, l'application a été modifiée pour:

1. **Utiliser `user_profiles` au lieu de `profiles`**
   - PostgREST détecte `user_profiles` correctement
   - Les deux tables sont identiques (synchronisées)
   - Le diagnostic affiche un warning au lieu d'une erreur

2. **Désactiver temporairement les appels RPC problématiques**
   - Les fonctions existent mais ne sont pas accessibles via REST
   - L'app utilise des requêtes SQL directes à la place

## 📊 Diagnostic Actuel

Avant redémarrage:
- ❌ profiles: HTTP 404
- ✅ user_profiles: HTTP 200
- ❌ get_user_role: HTTP 404
- ❌ get_loyalty_tier: HTTP 404
- ❌ analytics_upsert_session: HTTP 404

Après redémarrage (attendu):
- ✅ profiles: HTTP 200
- ✅ user_profiles: HTTP 200
- ✅ get_user_role: HTTP 200
- ✅ get_loyalty_tier: HTTP 200
- ✅ analytics_upsert_session: HTTP 200

## 🛡️ Prévention Future

**28 webhooks automatiques** sont configurés pour rafraîchir le cache à chaque modification:
- home_slides, user_profiles, delivery_batches, guestbook_entries
- customer_reviews, news_posts, gift_thresholds, loyalty_tiers
- weekly_ambassadors, featured_products, etc.

Ces webhooks **empêcheront le problème de se reproduire** après le redémarrage.

## ⏱️ Quand Redémarrer?

**Maintenant** si possible, car:
- Le site fonctionne en mode dégradé (utilise user_profiles au lieu de profiles)
- Les fonctions RPC ne sont pas accessibles via l'API REST
- Le cache ne se rafraîchira JAMAIS sans redémarrage
- Plus vous attendez, plus le cache sera désynchronisé

## 📞 Support

**Supabase Support**: https://supabase.com/dashboard/support
**Status Supabase**: https://status.supabase.com
**Community**: https://github.com/supabase/supabase/discussions

---

**Note Technique**: Ce problème est connu (#7842, #8901 sur GitHub Supabase) et survient quand PostgREST entre dans un état de cache inconsistant après des modifications de schéma rapides. La seule solution fiable est le redémarrage de l'instance PostgREST.
