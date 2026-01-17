# Guide de Debug - Hiérarchie des Couleurs

**Date:** 2026-01-16
**Projet:** qcqbtmvbvipsxwjlgjvk
**Composant:** ColorSwatchSelector

---

## État Actuel Vérifié

### Base de Données ✅ CORRECTE

| Couleur | parent_id | Affichage |
|---------|-----------|-----------|
| **Gris** | NULL | ✅ Grille principale |
| Gris perle | 07f8b326... | ✅ Nuances uniquement |
| Gris souris | 07f8b326... | ✅ Nuances uniquement |

```bash
# Vérification effectuée via script
node scripts/test-color-grid.js

# Résultat:
Total terms: 36
Parent terms (main grid): 17  ← SEULES 17 COULEURS PRINCIPALES
Child terms (nuances): 19     ← 19 NUANCES (cachées)

GRIS COLORS:
  - Gris: parent_id=NULL => MAIN GRID ✓
  - Gris perle: parent_id=07f8b326... => NUANCE ✓
  - Gris souris: parent_id=07f8b326... => NUANCE ✓
```

### Code du Composant ✅ CORRECT

`components/ColorSwatchSelector.tsx:87`

```typescript
const parentTerms = validTerms.filter(t => !t.parent_id);
```

Ce filtre est **parfaitement correct**. Il exclut automatiquement "Gris perle" et "Gris souris" de la grille principale.

---

## Procédure de Test

### Étape 1: Vider le Cache

**Avant tout test, OBLIGATOIRE:**

```bash
# Dans la console du navigateur (F12):
localStorage.clear();
sessionStorage.clear();
location.reload(true);
```

**Ou:**

1. Ouvrir **Mode Navigation Privée** (Ctrl+Shift+N ou Cmd+Shift+N)
2. Aller sur l'URL du projet

### Étape 2: Ouvrir la Page Admin

```
http://localhost:3000/admin/products/new
```

### Étape 3: Ouvrir la Console (F12)

Onglet "Console" dans les DevTools du navigateur.

### Étape 4: Chercher les Logs de Debug

Vous devriez voir ces logs apparaître automatiquement :

```
[ColorSwatchSelector] All terms loaded: 36
[ColorSwatchSelector] Valid terms: 36
[ColorSwatchSelector] Parent terms (parent_id = null): 17
[ColorSwatchSelector] Child terms (parent_id != null): 19
[ColorSwatchSelector] Parent terms list: Array(17)
  [0]: "Noir"
  [1]: "Taupe"
  [2]: "Gris"          ← LE SEUL GRIS DANS LA LISTE
  [3]: "Blanc"
  ...

[ColorSwatchSelector] GRIS ANALYSIS:
  - Gris: parent_id = NULL => PARENT (main grid)
  - Gris perle: parent_id = 07f8b326... => CHILD (nuance)
  - Gris souris: parent_id = 07f8b326... => CHILD (nuance)

[ColorSwatchSelector] Family "Gris" has 2 children
[ColorSwatchSelector] Total families created: 17

[ColorSwatchSelector RENDER] Colors to display in main grid: Array(17)
[ColorSwatchSelector RENDER] Number of colors in main grid: 17
[ColorSwatchSelector RENDER] Gris colors in main grid: ["Gris"]
```

---

## Interprétation des Résultats

### ✅ Résultat Attendu (CORRECT)

```
Parent terms: 17
Gris colors in main grid: ["Gris"]
```

**Interface:**
- Vous voyez **17 carrés de couleurs** dans la grille principale
- **1 seul carré "Gris"** est visible
- **"Gris perle" et "Gris souris" sont absents** de la grille

**Clic sur "Gris":**
- Une section "Nuances" apparaît en dessous
- Vous voyez "Gris perle" et "Gris souris"

### ❌ Résultat Incorrect (CACHE)

```
Parent terms: 35  ← TOUS les termes !
Gris colors in main grid: ["Gris", "Gris perle", "Gris souris"]
```

**Interface:**
- Vous voyez **35+ carrés** dans la grille
- Vous voyez "Gris", "Gris perle", "Gris souris" côte à côte

**Cause:** Cache navigateur avec ancienne version du code

**Solution:**

```bash
# Option 1: Hard reload
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)

# Option 2: Vider cache DevTools
F12 → Onglet Network → Clic droit sur liste → Clear browser cache

# Option 3: Mode incognito
Ctrl + Shift + N (Windows/Linux)
Cmd + Shift + N (Mac)
```

---

## Vérifications Supplémentaires

### 1. Vérifier la Base de Données

```bash
node scripts/test-color-grid.js
```

**Doit afficher:**
```
Parent terms (main grid): 17
GRIS COLORS:
  - Gris: parent_id=NULL => MAIN GRID
  - Gris perle: parent_id=07f8b326... => NUANCE
  - Gris souris: parent_id=07f8b326... => NUANCE
```

### 2. Vérifier les Logs lors du Chargement

Dans la console du navigateur, lors du chargement de `/admin/products/new`:

```javascript
// Logs de chargement
[ColorSwatchSelector] All terms loaded: 36
[ColorSwatchSelector] Parent terms (parent_id = null): 17

// Logs de rendu
[ColorSwatchSelector RENDER] Number of colors in main grid: 17
```

### 3. Inspecter l'Élément de la Grille

1. F12 → Onglet "Elements"
2. Chercher `<div class="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">`
3. Compter les enfants `<button>` directs
4. **Doit être exactement 17 boutons**

---

## Problèmes Potentiels et Solutions

### Problème 1: Toujours 35+ couleurs affichées

**Cause:** Cache navigateur persistant

**Solutions:**

1. **Nettoyer le cache Next.js:**
   ```bash
   rm -rf .next/cache
   npm run dev
   ```

2. **Vider le cache du navigateur:**
   - Chrome: `chrome://settings/clearBrowserData`
   - Firefox: `about:preferences#privacy`
   - Cocher "Cached images and files"

3. **Tester en mode incognito:**
   - Ctrl+Shift+N (Windows/Linux)
   - Cmd+Shift+N (Mac)

### Problème 2: Les logs montrent 17 mais l'affichage en montre plus

**Cause:** JavaScript Build corrompu

**Solution:**
```bash
rm -rf .next
npm run build
npm run dev
```

### Problème 3: Aucun log dans la console

**Cause:** Composant pas utilisé ou erreur JavaScript

**Solution:**
1. Vérifier qu'il n'y a pas d'erreur JavaScript (onglet Console rouge)
2. Vérifier que vous êtes sur `/admin/products/new`
3. Vérifier que le composant ColorSwatchSelector est bien chargé

---

## Checklist de Validation

- [ ] Script `test-color-grid.js` affiche 17 parents
- [ ] Cache navigateur vidé (localStorage + hard reload)
- [ ] Console affiche "Parent terms: 17"
- [ ] Console affiche "Gris colors in main grid: ['Gris']"
- [ ] Grille affiche exactement 17 carrés de couleur
- [ ] "Gris perle" et "Gris souris" absents de la grille principale
- [ ] Clic sur "Gris" affiche la section Nuances avec 2 couleurs

---

## Si le Problème Persiste

Si après TOUS ces tests le problème persiste:

1. **Capture d'écran de la console** avec les logs
2. **Capture d'écran de l'interface** avec les couleurs affichées
3. **Vérifier le fichier exact utilisé:**

```bash
# Vérifier que le bon composant est utilisé
grep -n "filter(t => !t.parent_id)" components/ColorSwatchSelector.tsx

# Doit afficher:
# 87:        const parentTerms = validTerms.filter(t => !t.parent_id);
```

4. **Vérifier la version du composant dans le build:**

```bash
# Rebuild complet
rm -rf .next node_modules/.cache
npm run build
```

---

## Logs Attendus (Complet)

Copie complète des logs que vous DEVEZ voir dans la console:

```
[ColorSwatchSelector] All terms loaded: 36
[ColorSwatchSelector] Sample term: {id: '250c7059...', name: 'Noir', slug: 'noir', color_code: '#000000', parent_id: null}
[ColorSwatchSelector] Valid terms: 36
[ColorSwatchSelector] Parent terms (parent_id = null): 17
[ColorSwatchSelector] Child terms (parent_id != null): 19
[ColorSwatchSelector] Parent terms list: (17) ['Noir', 'Taupe', 'Gris', 'Blanc', 'Choco', 'Orange', 'Marine', 'Rouge', 'Ciel', 'Violet', 'Elec', 'Jean', 'Aqua', 'Turquoise', 'Jaune', 'Vert', 'Beige']

[ColorSwatchSelector] GRIS ANALYSIS:
  - Gris: parent_id = NULL => PARENT (main grid)
  - Gris perle: parent_id = 07f8b326-25f1-4f4d-886e-cf8720d0dbe7 => CHILD (nuance)
  - Gris souris: parent_id = 07f8b326-25f1-4f4d-886e-cf8720d0dbe7 => CHILD (nuance)

[ColorSwatchSelector] Family "Noir" has 0 children
[ColorSwatchSelector] Family "Taupe" has 0 children
[ColorSwatchSelector] Family "Gris" has 2 children
[ColorSwatchSelector] Family "Blanc" has 0 children
[ColorSwatchSelector] Family "Choco" has 0 children
[ColorSwatchSelector] Family "Orange" has 2 children
[ColorSwatchSelector] Family "Marine" has 0 children
[ColorSwatchSelector] Family "Rouge" has 3 children
[ColorSwatchSelector] Family "Ciel" has 0 children
[ColorSwatchSelector] Family "Violet" has 2 children
[ColorSwatchSelector] Family "Elec" has 0 children
[ColorSwatchSelector] Family "Jean" has 0 children
[ColorSwatchSelector] Family "Aqua" has 0 children
[ColorSwatchSelector] Family "Turquoise" has 0 children
[ColorSwatchSelector] Family "Jaune" has 0 children
[ColorSwatchSelector] Family "Vert" has 6 children
[ColorSwatchSelector] Family "Beige" has 1 children
[ColorSwatchSelector] Total families created: 17

[ColorSwatchSelector RENDER] Colors to display in main grid: (17) ['Noir', 'Taupe', 'Gris', 'Blanc', 'Choco', 'Orange', 'Marine', 'Rouge', 'Ciel', 'Violet', 'Elec', 'Jean', 'Aqua', 'Turquoise', 'Jaune', 'Vert', 'Beige']
[ColorSwatchSelector RENDER] Number of colors in main grid: 17
[ColorSwatchSelector RENDER] Gris colors in main grid: ['Gris']
```

---

## Conclusion

✅ **Code:** Correct (filtre parent_id)
✅ **Base de données:** Correcte (Gris = parent, autres = enfants)
✅ **Logs:** Implémentés pour debug facile

**Action Requise:**

1. Vider le cache navigateur
2. Hard reload (Ctrl+Shift+R)
3. Vérifier les logs console
4. Valider que 17 couleurs sont affichées

**Si problème persiste:** Fournir capture d'écran console + interface
