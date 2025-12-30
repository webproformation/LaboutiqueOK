# Instructions pour Débloquer le Cache PostgREST

## Contexte
- Site en production : https://www.laboutiquedemorgane.com
- Supabase URL : https://qcqbtmvbvipsxwjlgjvk.supabase.co
- Problème : Cache PostgREST bloqué, impossible d'accéder à /admin

## Solution en 3 Étapes

### ÉTAPE 1 : Forcer le Rafraîchissement du Cache (5 min)

1. **Allez sur le Dashboard Supabase** : https://supabase.com/dashboard/project/qcqbtmvbvipsxwjlgjvk
2. **Cliquez sur "SQL Editor"** (dans le menu de gauche)
3. **Créez une nouvelle requête**
4. **Copiez-collez TOUT le contenu de** `FORCE_POSTGREST_CACHE_REFRESH.sql`
5. **Cliquez sur "Run"** (bouton en bas à droite)
6. **Attendez** que l'exécution se termine (devrait afficher "Success")

### ÉTAPE 2 : Redémarrer PostgREST (2 min)

1. **Dans le Dashboard Supabase, allez dans** : Settings → API
2. **Scrollez jusqu'à la section "PostgREST"**
3. **Cliquez sur le bouton "Restart"**
4. **Attendez 60 secondes** (important !)

### ÉTAPE 3 : Vous Donner les Droits Admin (3 min)

1. **Retournez dans "SQL Editor"**
2. **Créez une nouvelle requête**
3. **Copiez le contenu de** `GRANT_ADMIN_DIRECT_SQL.sql`
4. **IMPORTANT : Remplacez `'VOTRE_EMAIL_ICI'` par votre vrai email** (dans TOUTES les occurrences)
5. **Cliquez sur "Run"**
6. **Vérifiez** que vous voyez le message "Admin access granted!"

### ÉTAPE 4 : Se Reconnecter (1 min)

1. **Déconnectez-vous** de votre compte sur le site
2. **Reconnectez-vous** avec vos identifiants
3. **Allez sur** : https://www.laboutiquedemorgane.com/admin
4. **✅ Vous devriez avoir accès !**

## Si ça ne fonctionne toujours pas

### Plan B : Vérifier le Projet Supabase

Il est possible que vous ayez plusieurs projets Supabase. Vérifiez que vous êtes bien sur le bon projet :

1. **Vérifiez l'URL** : `qcqbtmvbvipsxwjlgjvk.supabase.co`
2. **Vérifiez dans** Settings → API que l'URL correspond
3. **Si ce n'est pas le bon projet**, trouvez le bon projet et recommencez les étapes

### Plan C : Vider Complètement les Tables (DANGEREUX)

⚠️ **ATTENTION : Cette option supprime TOUTES les données !**

Si vous voulez repartir de zéro :

```sql
-- SUPPRIME TOUT (À UTILISER AVEC PRÉCAUTION)
TRUNCATE user_roles CASCADE;
TRUNCATE user_profiles CASCADE;
TRUNCATE home_slides CASCADE;
TRUNCATE home_categories CASCADE;
-- etc...
```

## Après avoir résolu le problème

Une fois que vous avez accès à /admin, nettoyez les données de test :

1. **Allez dans SQL Editor**
2. **Copiez le contenu de** `CLEAN_TEST_DATA.sql`
3. **Exécutez le script**

## Fichiers Créés

- `FORCE_POSTGREST_CACHE_REFRESH.sql` : Insère des données dans toutes les tables pour forcer le rafraîchissement
- `GRANT_ADMIN_DIRECT_SQL.sql` : Vous donne les droits admin directement en SQL
- `CLEAN_TEST_DATA.sql` : Nettoie les données de test après
- `INSTRUCTIONS_CACHE_POSTGREST.md` : Ce fichier d'instructions

## Pourquoi cette méthode fonctionne

1. **Insertion de données** : Force PostgREST à détecter les changements dans toutes les tables
2. **NOTIFY pgrst** : Envoie des notifications à PostgREST pour qu'il recharge le schéma
3. **Modification de schéma** : Ajoute puis supprime une colonne pour forcer un changement DDL
4. **VACUUM ANALYZE** : Nettoie et rafraîchit les statistiques de la base
5. **Restart PostgREST** : Redémarre complètement le service pour vider le cache mémoire
6. **Métadonnées auth** : Définit le rôle directement dans auth.users pour contourner PostgREST

## Contact

Si après tout ça, ça ne fonctionne toujours pas, il faudra :
1. Vérifier les logs PostgREST dans le Dashboard Supabase
2. Vérifier qu'il n'y a pas d'erreurs dans la console du navigateur
3. Essayer avec un autre navigateur / mode incognito
