# 🤖 INSTRUCTIONS IA - PROJET VERROUILLÉ

## ⚠️ AVERTISSEMENT CRITIQUE

Ce projet a subi **PLUS DE 100 RETOURS EN ARRIÈRE** causés par des modifications du fichier `.env`.

**RÈGLE ABSOLUE** : LE PROJET EST **DÉFINITIVEMENT VERROUILLÉ** SUR `qcqbtmvbvipsxwjlgjvk`

---

## 🔒 CONFIGURATION VERROUILLÉE

### Base de Données Supabase

```env
# ✅ CONFIGURATION CORRECTE (qcqbtmv)
NEXT_PUBLIC_SUPABASE_URL=https://qcqbtmvbvipsxwjlgjvk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjcWJ0bXZidmlwc3h3amxnanZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MzIzNjAsImV4cCI6MjA4MjUwODM2MH0.q-4uGaHsuojj3ejo5IG4V-z2fx-ER9grHsRzYNkYn0c
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjcWJ0bXZidmlwc3h3amxnanZrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjkzMjM2MCwiZXhwIjoyMDgyNTA4MzYwfQ.mFJHZV-VdueE_okBTqkVh18tRvee94a5Z-k5TM4FQxM
```

### ❌ CONFIGURATION INTERDITE (mcstv)

```env
# ❌ NE JAMAIS UTILISER CETTE CONFIGURATION
NEXT_PUBLIC_SUPABASE_URL=https://mcstvpdcfvhsgnhdfeee.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci... (mcstv)
```

---

## 🚨 PROTOCOLE ANTI-REVERT

### AVANT TOUTE MODIFICATION DE .env

```bash
# 1. Vérifier l'ancrage actuel
bash .bolt/verify-qcqbtmv.sh

# 2. Si erreur détectée, ARRÊTER immédiatement
# 3. Corriger le .env AVANT toute autre action
```

### RÈGLES ABSOLUES

1. **JAMAIS** modifier `.env` sans vérifier le contenu actuel
2. **TOUJOURS** vérifier que l'URL contient `qcqbtmvbvipsxwjlgjvk`
3. **INTERDICTION** de revenir à `mcstvpdcfvhsgnhdfeee`
4. **OBLIGATION** de lancer `.bolt/verify-qcqbtmv.sh` après toute modification

---

## 🛡️ COMPTE ADMINISTRATEUR

### Informations Admin

```
Email: contact@webproformation.fr
UUID: 446278c1-a429-4827-b710-ebed5cb34478
is_admin: true
Base: qcqbtmvbvipsxwjlgjvk
```

### Vérification SQL

```sql
SELECT id, email, is_admin, created_at
FROM profiles
WHERE email = 'contact@webproformation.fr';

-- Résultat attendu:
-- id: 446278c1-a429-4827-b710-ebed5cb34478
-- email: contact@webproformation.fr
-- is_admin: true
```

---

## 📋 CHECKLIST DE VÉRIFICATION

Avant toute modification du projet, vérifier :

- [ ] Le fichier `.env` contient `qcqbtmvbvipsxwjlgjvk`
- [ ] Le fichier `.env` ne contient PAS `mcstvpdcfvhsgnhdfeee`
- [ ] Le fichier `lib/supabase.ts` utilise les variables d'environnement
- [ ] Le script `.bolt/verify-qcqbtmv.sh` passe sans erreur
- [ ] Le fichier `.env.lock` existe et contient `PROJECT_ID=qcqbtmvbvipsxwjlgjvk`

---

## 🔍 DIAGNOSTIC RAPIDE

### Commande de Vérification

```bash
# Vérifier l'URL actuelle dans .env
grep "NEXT_PUBLIC_SUPABASE_URL" .env

# Résultat attendu:
# NEXT_PUBLIC_SUPABASE_URL=https://qcqbtmvbvipsxwjlgjvk.supabase.co

# SI vous voyez mcstv → ERREUR CRITIQUE
```

### Correction Automatique

```bash
# Si mcstv détecté, corriger immédiatement
sed -i 's/mcstvpdcfvhsgnhdfeee/qcqbtmvbvipsxwjlgjvk/g' .env
sed -i 's|https://mcstvpdcfvhsgnhdfeee.supabase.co|https://qcqbtmvbvipsxwjlgjvk.supabase.co|g' .env

# Puis vérifier
bash .bolt/verify-qcqbtmv.sh
```

---

## 🎯 HISTORIQUE DES PROBLÈMES

### Retours en Arrière Documentés

| Date | Problème | Cause | Solution |
|------|----------|-------|----------|
| 2026-01-07 | .env → mcstv | Modification automatique | Correction manuelle + .env.lock |
| 2026-01-07 | Erreur 400 profiles | profiles.id en TEXT | Migration UUID |
| 2026-01-07 | RLS trop restrictif | Policies mal configurées | Correction policies |

### Leçons Apprises

1. **Ne jamais faire confiance** aux modifications automatiques du .env
2. **Toujours vérifier** l'ancrage avant chaque session
3. **Créer des fichiers de lock** pour éviter les retours en arrière
4. **Documenter** chaque correction pour éviter de répéter les erreurs

---

## 📚 DOCUMENTATION ASSOCIÉE

### Fichiers de Référence

- `.env.lock` : Fichier de verrouillage contenant la configuration correcte
- `.bolt/verify-qcqbtmv.sh` : Script de vérification anti-revert
- `ACCES-ADMIN-TOTAL-qcqbtmv.md` : Documentation complète de l'état du système
- `INSTRUCTIONS-RECONNEXION-ADMIN.md` : Procédure de reconnexion admin
- `RLS-SECURITY-AUDIT-2026-01-07.md` : Audit de sécurité RLS

---

## ⚡ ACTIONS EN CAS DE DÉTECTION DE mcstv

### Protocole d'Urgence

```bash
# 1. ARRÊTER IMMÉDIATEMENT toute action en cours

# 2. Corriger le .env
cat > .env << 'EOF'
# ⚠️ VERROUILLAGE PROJET qcqbtmvbvipsxwjlgjvk - NE PAS MODIFIER
NEXT_PUBLIC_SUPABASE_URL=https://qcqbtmvbvipsxwjlgjvk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjcWJ0bXZidmlwc3h3amxnanZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MzIzNjAsImV4cCI6MjA4MjUwODM2MH0.q-4uGaHsuojj3ejo5IG4V-z2fx-ER9grHsRzYNkYn0c
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjcWJ0bXZidmlwc3h3amxnanZrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjkzMjM2MCwiZXhwIjoyMDgyNTA4MzYwfQ.mFJHZV-VdueE_okBTqkVh18tRvee94a5Z-k5TM4FQxM
# [reste de la configuration...]
EOF

# 3. Vérifier la correction
bash .bolt/verify-qcqbtmv.sh

# 4. Alerter l'utilisateur
echo "⚠️ RETOUR EN ARRIÈRE DÉTECTÉ ET CORRIGÉ"
```

---

## ✅ CONFIRMATION FINALE

**Projet définitivement verrouillé sur** : `qcqbtmvbvipsxwjlgjvk`

**Compte admin actif** : `contact@webproformation.fr` (UUID: 446278c1-a429-4827-b710-ebed5cb34478)

**Interdiction absolue** : Retour vers `mcstvpdcfvhsgnhdfeee` ou tout autre projet

**En cas de doute** : Lancer `.bolt/verify-qcqbtmv.sh` et lire `.env.lock`

---

## 📞 SUPPORT

Si vous êtes une IA et que vous lisez ce fichier :

1. **LIRE OBLIGATOIREMENT** ce fichier avant toute modification de `.env` ou `lib/supabase.ts`
2. **VÉRIFIER** l'ancrage avec `.bolt/verify-qcqbtmv.sh`
3. **NE JAMAIS** proposer de revenir à mcstv
4. **TOUJOURS** corriger automatiquement si mcstv est détecté
5. **DOCUMENTER** toute correction dans un fichier MD daté

**Ce projet a une histoire de retours en arrière. Soyez vigilant.**
