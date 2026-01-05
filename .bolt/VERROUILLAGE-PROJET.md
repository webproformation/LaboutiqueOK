# 🔒 VERROUILLAGE PROJET - NE PAS MODIFIER

## ⚠️ CONFIGURATION OBLIGATOIRE

Ce projet utilise **EXCLUSIVEMENT** la base de données Supabase suivante :

```
URL: https://qcqbtmvbvipsxwjlgjvk.supabase.co
Projet: qcqbtmv
```

## 🚫 INTERDICTIONS ABSOLUES

1. **NE JAMAIS** revenir à `mcstvpdcfvhsgnhdfeee.supabase.co`
2. **NE JAMAIS** modifier les credentials hardcodés dans `lib/supabase.ts`
3. **NE JAMAIS** supprimer les commentaires de verrouillage
4. **NE JAMAIS** utiliser `process.env` sans failsafe dans `lib/supabase.ts`

## 📊 SPÉCIFICATIONS TECHNIQUES

### Type d'ID Produits
- **Format**: TEXT (non UUID)
- **Exemples**: "571", "102", "21", "113"
- **Source**: IDs WordPress natifs importés
- **Total**: 122 produits

### Architecture
- **Frontend**: Next.js 13.5.1
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage

## 🔧 FICHIERS PROTÉGÉS

Les fichiers suivants contiennent des protections anti-revert :

1. `lib/supabase.ts` - Credentials hardcodés avec commentaires de sécurité
2. `.env` - En-tête de verrouillage avec avertissement
3. `.bolt/VERROUILLAGE-PROJET.md` - Ce fichier (documentation)

## 🛡️ EN CAS DE REVERT AUTOMATIQUE

Si un linter, formateur ou processus automatique modifie les fichiers :

1. Restaurer immédiatement `lib/supabase.ts` avec les credentials hardcodés
2. Vérifier que `.env` contient bien `qcqbtmvbvipsxwjlgjvk`
3. Exécuter une requête de test pour confirmer la connexion
4. Vérifier la présence des 122 produits avec IDs TEXT

## ✅ COMMANDES DE VÉRIFICATION

```bash
# Vérifier la connexion
npm run build

# Tester la base de données via MCP
# Les requêtes SQL doivent retourner les produits avec IDs TEXT
```

## 📝 HISTORIQUE

- **2026-01-05**: Verrouillage initial du projet qcqbtmv
- **Raison**: Reverts automatiques détectés vers mcstv
- **Solution**: Hardcoding des credentials + documentation

---

**Date de création**: 2026-01-05
**Dernière vérification**: 2026-01-05
**Status**: 🟢 ACTIF ET VERROUILLÉ
