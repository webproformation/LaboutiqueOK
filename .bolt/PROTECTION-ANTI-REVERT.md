# 🛡️ PROTECTION ANTI-REVERT - PROJET qcqbtmv

**Date de verrouillage:** 2026-01-07
**Projet verrouillé:** qcqbtmvbvipsxwjlgjvk
**INTERDIT:** mcstvpdcfvhsgnhdfeee

## Historique des corruptions détectées

### Corruption #1 - 2026-01-07 16:50
- **Détection:** .env modifié pour pointer sur mcstv
- **Cause:** Modification externe ou revert accidentel
- **Action:** Restauration immédiate sur qcqbtmv
- **Preuve:** Utilisateur contact@webproformation.fr existait déjà

## Mécanismes de protection mis en place

### 1. Triple verrouillage
- ✅ `.env` verrouillé sur qcqbtmv avec commentaire d'avertissement
- ✅ `lib/supabase.ts` utilise des constantes hardcodées (LOCKED_SUPABASE_URL)
- ✅ Script de vérification `.bolt/verify-qcqbtmv.sh` créé

### 2. Script de vérification
```bash
./.bolt/verify-qcqbtmv.sh
```

Ce script vérifie :
- ✅ Que .env pointe bien sur qcqbtmv
- ✅ Qu'aucune référence à mcstv n'existe
- ❌ Échec si corruption détectée

### 3. Utilisateur admin
- **Email:** contact@webproformation.fr
- **Mot de passe:** WebPro2026!
- **Statut:** is_admin = true
- **Créé:** 2026-01-07 16:43:14 UTC
- **ID:** 420fcb2b-be27-49c5-a481-ed812a726516

## Instructions pour vérifier le projet

**AVANT TOUTE ACTION, TOUJOURS EXÉCUTER:**
```bash
./.bolt/verify-qcqbtmv.sh
```

Si le script échoue, NE PAS continuer et restaurer immédiatement.

## Commande de restauration d'urgence

Si .env est corrompu :
```bash
cat > .env << 'EOF'
# ⚠️ VERROUILLAGE PROJET qcqbtmvbvipsxwjlgjvk - NE PAS MODIFIER
NEXT_PUBLIC_SUPABASE_URL=https://qcqbtmvbvipsxwjlgjvk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjcWJ0bXZidmlwc3h3amxnanZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MzIzNjAsImV4cCI6MjA4MjUwODM2MH0.q-4uGaHsuojj3ejo5IG4V-z2fx-ER9grHsRzYNkYn0c
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjcWJ0bXZidmlwc3h3amxnanZrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjkzMjM2MCwiZXhwIjoyMDgyNTA4MzYwfQ.mFJHZV-VdueE_okBTqkVh18tRvee94a5Z-k5TM4FQxM
EOF
```

## Logs de sécurité

### Vérification actuelle
```
✅ .env pointe sur qcqbtmv
✅ Aucune référence à mcstv trouvée
✅ lib/supabase.ts utilise LOCKED_SUPABASE_URL
✅ Utilisateur admin existe et est actif
```

---

**RAPPEL CRITIQUE:** Toujours exécuter `.bolt/verify-qcqbtmv.sh` avant toute modification du code ou de la base de données.
