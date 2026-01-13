/*
  # Migration : Slug descriptif pour Dressing (34-54)
  
  1. Modifications
    - Mise à jour du slug "dressing" → "dressing-34-54"
    - Catégorie : "Dressing (34-54)" (id: 19)
    
  2. Raison
    - Correspondance exacte entre le nom affiché et le slug technique
    - URLs plus descriptives : /category/dressing-34-54
    
  3. Impact
    - Les anciennes URLs /category/dressing seront obsolètes
    - Le méga-menu continuera de fonctionner avec le nouveau slug
    - Aucun impact sur les RLS policies
*/

-- Mise à jour du slug pour la catégorie "Dressing (34-54)"
UPDATE categories 
SET slug = 'dressing-34-54'
WHERE id = '19' 
  AND name = 'Dressing (34-54)'
  AND slug = 'dressing';
