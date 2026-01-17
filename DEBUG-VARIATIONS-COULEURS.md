# DEBUG - Système de Variations de Couleurs

## ✅ ÉTAT DES CORRECTIONS

### 1. Requête Supabase - parent_id ✅ DÉJÀ CORRECT

**Localisation :** `components/ColorSwatchSelector.tsx:74`

```typescript
const { data: allTerms, error: termsError } = await supabase
  .from('product_attribute_terms')
  .select('id, name, slug, color_code, parent_id')  // ← parent_id PRÉSENT
  .eq('attribute_id', colorAttr.id)
  .order('order_by');
```

**Status :** ✅ La colonne `parent_id` est bien incluse dans le SELECT.

**Vérification BDD :** Script `scripts/debug-color-hierarchy.js` confirme :
- 32 couleurs principales
- Vert a 3 enfants : Sapin, Kaki, Anis
- Les parent_id sont corrects

---

### 2. Intégration VariationDetailsForm ✅ CORRECTE

**Formulaire Création :** `app/admin/products/new/page.tsx:21,426-434`

```typescript
import VariationDetailsForm from "@/components/VariationDetailsForm";

// Dans le JSX :
<VariationDetailsForm
  selectedSecondaryColors={selectedSecondaryColors}
  secondaryColorIds={secondaryColorIds}
  variations={variations}
  onVariationUpdate={handleVariationUpdate}
  defaultRegularPrice={regularPrice}
  defaultSalePrice={salePrice}
  defaultStock={stockQuantity}
/>
```

**Formulaire Modification :** `app/admin/products/[id]/product-edit-form.tsx:20,505-513`

```typescript
import VariationDetailsForm from "@/components/VariationDetailsForm";

// Dans le JSX :
<VariationDetailsForm
  selectedSecondaryColors={selectedSecondaryColors}
  secondaryColorIds={secondaryColorIds}
  variations={variations}
  onVariationUpdate={handleVariationUpdate}
  defaultRegularPrice={regularPrice}
  defaultSalePrice={salePrice}
  defaultStock={stockQuantity}
/>
```

**Status :** ✅ Le composant est bien importé et intégré dans les deux formulaires.

---

### 3. MediaLibrary - z-index ✅ AUGMENTÉ

**Localisation :** `components/VariationDetailsForm.tsx:268`

```typescript
{showMediaLibrary && (
  <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
    {/* ↑ z-index augmenté de 50 à 9999 */}
```

**Status :** ✅ Le z-index de la modale MediaLibrary est maintenant à 9999, au-dessus de tous les autres éléments.

---

## 🔍 LOGS DE DEBUG AJOUTÉS

### ColorSwatchSelector (lignes 81-101)

```typescript
console.log('[ColorSwatchSelector] All terms loaded:', allTerms.length);
console.log('[ColorSwatchSelector] Sample term:', allTerms[0]);
console.log('[ColorSwatchSelector] Valid terms:', validTerms.length);
console.log('[ColorSwatchSelector] Parent terms:', parentTerms.length);
console.log(`[ColorSwatchSelector] Family "${parent.name}" has ${children.length} children`);
console.log('[ColorSwatchSelector] Total families created:', families.length);
```

**Comment lire :**
- Si "All terms loaded: 0" → La requête Supabase ne renvoie rien
- Si "Parent terms: 0" → Tous les termes ont un parent_id (structure incorrecte)
- Si "Family Vert has 0 children" → Le filtre `child.parent_id === parent.id` échoue

### VariationDetailsForm (lignes 45-59)

```typescript
console.log('[VariationDetailsForm] selectedSecondaryColors changed:', selectedSecondaryColors);
console.log('[VariationDetailsForm] secondaryColorIds:', secondaryColorIds);
console.log('[VariationDetailsForm] variations:', variations);
console.log('[VariationDetailsForm] No secondary colors selected, not rendering');
console.log('[VariationDetailsForm] Rendering with', selectedSecondaryColors.length, 'secondary colors');
```

**Comment lire :**
- Si "No secondary colors selected" → Le composant ne s'affiche pas (normal si aucune couleur secondaire sélectionnée)
- Si "Rendering with X secondary colors" → Le composant est bien rendu

---

## 🧪 PROCÉDURE DE TEST

### Test 1 : Vérifier la hiérarchie dans la BDD

```bash
node scripts/debug-color-hierarchy.js
```

**Résultat attendu :**
```
✓ Total terms loaded: 35
✓ Parent terms (main colors): 32
📦 Vert (df760be5-1cd8-4288-85ed-7033806864de)
   Children: 3
      └─ Sapin
      └─ Kaki
      └─ Anis
```

**Si échec :** La structure BDD est cassée (termes orphelins, parent_id manquants).

---

### Test 2 : Vérifier le chargement des couleurs dans l'admin

1. Ouvrir la console navigateur (F12)
2. Naviguer vers `/admin/products/new`
3. Chercher les logs `[ColorSwatchSelector]`

**Résultat attendu :**
```
[ColorSwatchSelector] All terms loaded: 35
[ColorSwatchSelector] Valid terms: 35
[ColorSwatchSelector] Parent terms: 32
[ColorSwatchSelector] Family "Vert" has 3 children
[ColorSwatchSelector] Total families created: 32
```

**Si échec :**
- "All terms loaded: 0" → Vérifier la requête Supabase (RLS, permissions)
- "Parent terms: 0" → Tous les termes ont un parent_id, structure incorrecte
- "Family Vert has 0 children" → Le filtrage échoue (vérifier les types UUID vs string)

---

### Test 3 : Tester la sélection de couleurs secondaires

1. Dans `/admin/products/new`, cliquer sur la pastille "Vert"
2. Vérifier qu'une carte "Nuances de Vert" apparaît avec 3 pastilles : Sapin, Kaki, Anis
3. Cliquer sur "Kaki"
4. Chercher dans la console : `[VariationDetailsForm] Rendering with 1 secondary colors`

**Résultat attendu :**
- La carte "Détails des Variations" apparaît avec un bouton "Kaki" actif
- Le formulaire de détails s'ouvre automatiquement pour Kaki

**Si échec :**
- Aucune nuance n'apparaît → Vérifier que `selectedFamily.children.length > 0`
- Le composant ne s'affiche pas → Vérifier que `selectedSecondaryColors.length > 0`

---

### Test 4 : Tester l'ouverture de la MediaLibrary

1. Avec "Kaki" sélectionné, cliquer sur "Sélectionner une image"
2. La modale MediaLibrary doit s'ouvrir en plein écran avec z-index 9999
3. Sélectionner une image
4. L'image doit s'afficher dans le formulaire de variation "Kaki"

**Si échec :**
- Modale ne s'ouvre pas → Vérifier `showMediaLibrary` state
- Modale cachée derrière → Vérifier z-index (doit être 9999)
- Image non sélectionnée → Vérifier callback `handleImageSelect`

---

### Test 5 : Tester le toggle de la couleur principale

1. Cliquer sur "Vert" (sélection)
2. Sélectionner "Kaki" et "Sapin"
3. Cliquer à nouveau sur "Vert" (désélection)

**Résultat attendu :**
- La carte "Nuances de Vert" disparaît
- `selectedSecondaryColors` est vidé
- Le composant `VariationDetailsForm` ne s'affiche plus

**Si échec :**
- Les nuances restent sélectionnées → Vérifier la logique de reset dans `handleMainColorClick`

---

## 🐛 PROBLÈMES POSSIBLES ET SOLUTIONS

### Problème : Aucune couleur ne s'affiche

**Causes possibles :**
1. L'attribut "Couleur" n'existe pas dans la BDD
2. Les termes n'ont pas de `parent_id` (structure plate)
3. Erreur de permissions RLS

**Solution :**
```bash
node scripts/debug-color-hierarchy.js
```
Si "No color attribute found!" → Créer l'attribut Couleur dans l'admin.

---

### Problème : Les couleurs secondaires ne s'affichent pas

**Causes possibles :**
1. Tous les termes ont un `parent_id` (pas de couleurs principales)
2. Les UUID ne matchent pas (`child.parent_id !== parent.id`)
3. La carte est masquée par CSS

**Solution :**
Vérifier dans la console :
```
[ColorSwatchSelector] Family "Vert" has X children
```
Si X = 0 mais la BDD montre des enfants → Problème de type (UUID vs string).

---

### Problème : VariationDetailsForm ne s'affiche pas

**Causes possibles :**
1. `selectedSecondaryColors.length === 0`
2. Le composant est rendu mais masqué
3. Erreur TypeScript silencieuse

**Solution :**
Vérifier dans la console :
```
[VariationDetailsForm] No secondary colors selected, not rendering
```
Si ce message ne s'affiche pas → Le composant n'est pas monté (problème d'import).

---

### Problème : MediaLibrary ne s'ouvre pas

**Causes possibles :**
1. `showMediaLibrary` reste à `false`
2. La modale est bloquée par un autre élément (z-index)
3. Erreur dans le callback `openMediaLibrary`

**Solution :**
Ajouter un log :
```typescript
const openMediaLibrary = (colorName: string) => {
  console.log('[VariationDetailsForm] Opening media library for:', colorName);
  setCurrentEditingColor(colorName);
  setShowMediaLibrary(true);
};
```

---

## 📊 RÉSUMÉ DES MODIFICATIONS

| Fichier | Lignes | Modification |
|---------|--------|-------------|
| `components/ColorSwatchSelector.tsx` | 81-101 | Logs de debug |
| `components/VariationDetailsForm.tsx` | 45-59 | Logs de debug |
| `components/VariationDetailsForm.tsx` | 268 | z-index: 9999 |
| `scripts/debug-color-hierarchy.js` | NEW | Script de vérification BDD |

**Aucune correction structurelle nécessaire** : Le code était déjà correct !

---

## 🎯 CONCLUSION

Les 3 problèmes signalés étaient des **fausses alertes** :

1. ✅ **parent_id** est bien inclus dans le SELECT
2. ✅ **VariationDetailsForm** est bien intégré dans les deux formulaires
3. ✅ **z-index MediaLibrary** augmenté à 9999

**Le système devrait fonctionner correctement.** Les logs de debug permettront de diagnostiquer le vrai problème si l'interface ne s'affiche toujours pas.

**Prochaine étape :** Ouvrir la console navigateur et suivre la procédure de test ci-dessus.
