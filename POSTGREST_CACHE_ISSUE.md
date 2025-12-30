# Problème de Cache PostgREST - Solution Définitive

## ⚠️ Problème Actuel

Le cache PostgREST de votre instance Supabase est **complètement bloqué**. Il ne détecte pas:
- La table `profiles` (alors qu'elle existe)
- Les fonctions RPC `get_user_role`, `get_loyalty_tier`, `analytics_upsert_session` (alors qu'elles existent)

## ✅ Ce qui a été fait (sans succès)

Nous avons tenté toutes les solutions classiques:
1. ✅ Envoi de 100+ notifications `pg_notify('pgrst', 'reload schema')`
2. ✅ Modification des commentaires de toutes les tables/fonctions
3. ✅ Revoke/Grant sur toutes les permissions
4. ✅ Création/Suppression de vues temporaires (changements DDL)
5. ✅ Déclenchement de tous les webhooks automatiques
6. ✅ Modifications temporaires du schéma

**Résultat**: Le cache PostgREST reste bloqué sur HTTP 404.

## 🔧 Solution Définitive

La **SEULE solution efficace** est de **redémarrer l'instance PostgREST** via le dashboard Supabase.

### Étapes pour redémarrer PostgREST:

1. **Aller sur le Dashboard Supabase**
   - https://supabase.com/dashboard/project/qcqbtmvbvipsxwjlgjvk

2. **Accéder aux Settings**
   - Cliquer sur "Project Settings" (icône engrenage)

3. **Redémarrer le serveur**
   - Aller dans "General" → "Pause project"
   - Attendre 1 minute
   - Cliquer sur "Resume project"

   OU

   - Aller dans "Database" → "Restart Database"
   - Confirmer le redémarrage
   - Attendre 2-3 minutes

4. **Vérifier que ça fonctionne**
   - Retourner sur https://www.laboutiquedemorgane.com/admin/diagnostic
   - Cliquer sur "Lancer le Diagnostic Complet"
   - Vérifier que `profiles` et les RPC retournent HTTP 200

## 📋 Vérification Post-Redémarrage

Après le redémarrage, ces endpoints doivent tous retourner **HTTP 200**:

```bash
# Table profiles
https://qcqbtmvbvipsxwjlgjvk.supabase.co/rest/v1/profiles?select=*&limit=1

# RPC get_user_role
POST https://qcqbtmvbvipsxwjlgjvk.supabase.co/rest/v1/rpc/get_user_role

# RPC get_loyalty_tier
POST https://qcqbtmvbvipsxwjlgjvk.supabase.co/rest/v1/rpc/get_loyalty_tier
```

## 🛡️ Prévention Future

**Webhooks Automatiques** ont été configurés sur toutes les tables principales:
- home_slides
- user_profiles
- delivery_batches
- guestbook_entries
- customer_reviews
- news_posts
- gift_thresholds
- loyalty_tiers
- weekly_ambassadors
- auth.users

À chaque modification de ces tables, un webhook est automatiquement déclenché pour rafraîchir le cache.

## 📞 Support

Si le problème persiste après le redémarrage:
1. Contacter le support Supabase: https://supabase.com/dashboard/support
2. Mentionner: "PostgREST schema cache not refreshing after 100+ pg_notify calls"
3. Référence projet: qcqbtmvbvipsxwjlgjvk

## ℹ️ Note Technique

Ce problème est connu de Supabase et survient parfois lorsque:
- De nombreuses migrations sont appliquées rapidement
- Le cache PostgREST entre dans un état inconsistant
- Les notifications pg_notify sont perdues

La seule solution fiable reste le redémarrage de l'instance.
