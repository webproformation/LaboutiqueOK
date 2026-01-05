/*
  # Création des sous-catégories de produits

  1. Nouvelles sous-catégories
    - Ajoute des sous-catégories de niveau 1 et 2 pour Mode, Maison, et Beauté & Senteurs
    - Crée une hiérarchie complète pour le mega-menu
    
  2. Structure
    - Mode: Vêtements (Hauts, Bas, Robes), Accessoires (Sacs, Bijoux, Chaussures)
    - Maison: Décoration (Cadres, Bougies), Textile (Coussins, Plaids)
    - Beauté: Maquillage (Visage, Yeux), Parfums (Femme, Homme)
*/

-- Sous-catégories Mode (niveau 1)
INSERT INTO categories (id, name, slug, description, parent_id, display_order) VALUES
('mode-vetements', 'Vêtements', 'mode-vetements', 'Toute la mode vestimentaire', 'mode', 1),
('mode-accessoires', 'Accessoires', 'mode-accessoires', 'Accessoires de mode', 'mode', 2),
('mode-chaussures', 'Chaussures', 'mode-chaussures', 'Chaussures et bottines', 'mode', 3)
ON CONFLICT (id) DO NOTHING;

-- Sous-catégories Mode/Vêtements (niveau 2)
INSERT INTO categories (id, name, slug, description, parent_id, display_order) VALUES
('mode-vetements-hauts', 'Hauts', 'mode-vetements-hauts', 'Tops, chemises, pulls', 'mode-vetements', 1),
('mode-vetements-bas', 'Bas', 'mode-vetements-bas', 'Pantalons, jupes, shorts', 'mode-vetements', 2),
('mode-vetements-robes', 'Robes', 'mode-vetements-robes', 'Robes et combinaisons', 'mode-vetements', 3),
('mode-vetements-vestes', 'Vestes', 'mode-vetements-vestes', 'Vestes et manteaux', 'mode-vetements', 4)
ON CONFLICT (id) DO NOTHING;

-- Sous-catégories Mode/Accessoires (niveau 2)
INSERT INTO categories (id, name, slug, description, parent_id, display_order) VALUES
('mode-accessoires-sacs', 'Sacs', 'mode-accessoires-sacs', 'Sacs à main et pochettes', 'mode-accessoires', 1),
('mode-accessoires-bijoux', 'Bijoux', 'mode-accessoires-bijoux', 'Bijoux et fantaisie', 'mode-accessoires', 2),
('mode-accessoires-echarpes', 'Écharpes & Foulards', 'mode-accessoires-echarpes', 'Écharpes, foulards, étoles', 'mode-accessoires', 3)
ON CONFLICT (id) DO NOTHING;

-- Sous-catégories Maison (niveau 1)
INSERT INTO categories (id, name, slug, description, parent_id, display_order) VALUES
('maison-decoration', 'Décoration', 'maison-decoration', 'Objets décoratifs', 'maison', 1),
('maison-textile', 'Textile', 'maison-textile', 'Linge de maison', 'maison', 2),
('maison-rangement', 'Rangement', 'maison-rangement', 'Solutions de rangement', 'maison', 3)
ON CONFLICT (id) DO NOTHING;

-- Sous-catégories Maison/Décoration (niveau 2)
INSERT INTO categories (id, name, slug, description, parent_id, display_order) VALUES
('maison-decoration-cadres', 'Cadres & Photos', 'maison-decoration-cadres', 'Cadres et déco murale', 'maison-decoration', 1),
('maison-decoration-bougies', 'Bougies & Senteurs', 'maison-decoration-bougies', 'Bougies et diffuseurs', 'maison-decoration', 2),
('maison-decoration-vases', 'Vases & Fleurs', 'maison-decoration-vases', 'Vases et décoration florale', 'maison-decoration', 3)
ON CONFLICT (id) DO NOTHING;

-- Sous-catégories Maison/Textile (niveau 2)
INSERT INTO categories (id, name, slug, description, parent_id, display_order) VALUES
('maison-textile-coussins', 'Coussins', 'maison-textile-coussins', 'Coussins décoratifs', 'maison-textile', 1),
('maison-textile-plaids', 'Plaids', 'maison-textile-plaids', 'Plaids et couvertures', 'maison-textile', 2),
('maison-textile-rideaux', 'Rideaux', 'maison-textile-rideaux', 'Rideaux et voilages', 'maison-textile', 3)
ON CONFLICT (id) DO NOTHING;

-- Sous-catégories Beauté (niveau 1)
INSERT INTO categories (id, name, slug, description, parent_id, display_order) VALUES
('beaute-maquillage', 'Maquillage', 'beaute-maquillage', 'Produits de maquillage', 'beaute-senteurs', 1),
('beaute-parfums', 'Parfums', 'beaute-parfums', 'Parfums et eaux de toilette', 'beaute-senteurs', 2),
('beaute-soins', 'Soins', 'beaute-soins', 'Soins du visage et du corps', 'beaute-senteurs', 3)
ON CONFLICT (id) DO NOTHING;

-- Sous-catégories Beauté/Maquillage (niveau 2)
INSERT INTO categories (id, name, slug, description, parent_id, display_order) VALUES
('beaute-maquillage-visage', 'Visage', 'beaute-maquillage-visage', 'Fonds de teint, poudres', 'beaute-maquillage', 1),
('beaute-maquillage-yeux', 'Yeux', 'beaute-maquillage-yeux', 'Mascaras, fards à paupières', 'beaute-maquillage', 2),
('beaute-maquillage-levres', 'Lèvres', 'beaute-maquillage-levres', 'Rouges à lèvres, gloss', 'beaute-maquillage', 3)
ON CONFLICT (id) DO NOTHING;

-- Sous-catégories Beauté/Parfums (niveau 2)
INSERT INTO categories (id, name, slug, description, parent_id, display_order) VALUES
('beaute-parfums-femme', 'Parfums Femme', 'beaute-parfums-femme', 'Parfums féminins', 'beaute-parfums', 1),
('beaute-parfums-homme', 'Parfums Homme', 'beaute-parfums-homme', 'Parfums masculins', 'beaute-parfums', 2),
('beaute-parfums-mixte', 'Parfums Mixtes', 'beaute-parfums-mixte', 'Parfums unisexes', 'beaute-parfums', 3)
ON CONFLICT (id) DO NOTHING;