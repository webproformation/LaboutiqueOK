# TEST SYNCHRONISATION PRODUITS

## ÉTAPES RAPIDES

### 1. Ouvrir l'Interface
```
http://localhost:3000/admin/products
```

### 2. Lancer la Sync
- Cliquer "Sync WooCommerce"
- Attendre 1-2 minutes

### 3. Vérifier le Résultat

**Toast Attendu** :
```
✓ Synchronisation réussie!
Total: 122 | Créés: X | Mis à jour: Y
✓ Produits en base: 122
```

**Tableau Attendu** :
- ✅ 122 produits affichés
- ✅ Images miniatures
- ✅ Prix (ex: 49.99€)
- ✅ **Catégories sous chaque nom** (ex: "Vêtements, Robes")

## VÉRIFICATION SQL

```sql
-- Count products
SELECT COUNT(*) FROM products; -- Doit être 122

-- Check categories display
SELECT
  p.woocommerce_id,
  p.name,
  cat_elem->>'name' as category_name
FROM products p
CROSS JOIN LATERAL jsonb_array_elements(p.categories) as cat_elem
LIMIT 10;
```

## CHECKLIST

- [ ] Sync sans erreur
- [ ] 122 produits en base
- [ ] 122 produits affichés
- [ ] Catégories visibles sous les noms
- [ ] Persistance (F5 → toujours là)

**Si tout est ✅ → TEST RÉUSSI**
