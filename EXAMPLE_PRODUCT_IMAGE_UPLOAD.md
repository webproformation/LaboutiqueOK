# Exemple d'Intégration ImageUploader dans la Gestion des Produits

## 📝 Exemple pour /admin/products/[id]/page.tsx

Voici comment intégrer le composant `ImageUploader` dans la page d'édition de produits :

```tsx
"use client";

import { useState, useEffect } from 'react';
import ImageUploader from '@/components/ImageUploader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function EditProduct({ params }: { params: { id: string } }) {
  const [product, setProduct] = useState({
    name: '',
    price: 0,
    image_url: '',
    gallery_images: [] as string[], // Array d'URLs
  });

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Sauvegarder dans Supabase
      const { error } = await supabase
        .from('products')
        .update({
          name: product.name,
          image_url: product.image_url,
          images: product.gallery_images,
        })
        .eq('id', params.id);

      if (error) throw error;

      toast.success('Produit mis à jour');
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Modifier le Produit</h1>

      {/* Nom du produit */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Nom du produit
        </label>
        <Input
          value={product.name}
          onChange={(e) => setProduct({ ...product, name: e.target.value })}
        />
      </div>

      {/* Image principale */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Image principale
        </label>
        <ImageUploader
          value={product.image_url}
          onChange={(url) => setProduct({ ...product, image_url: url })}
          bucket="product-images"
          folder="products"
          previewClassName="w-48 h-48"
        />
      </div>

      {/* Galerie d'images */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Galerie d'images
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {product.gallery_images.map((url, index) => (
            <ImageUploader
              key={index}
              value={url}
              onChange={(newUrl) => {
                const newGallery = [...product.gallery_images];
                newGallery[index] = newUrl;
                setProduct({ ...product, gallery_images: newGallery });
              }}
              bucket="product-images"
              folder="products/gallery"
              previewClassName="w-32 h-32"
            />
          ))}
          {/* Bouton pour ajouter une nouvelle image */}
          <ImageUploader
            value=""
            onChange={(url) => {
              setProduct({
                ...product,
                gallery_images: [...product.gallery_images, url],
              });
            }}
            bucket="product-images"
            folder="products/gallery"
            previewClassName="w-32 h-32"
          />
        </div>
      </div>

      {/* Bouton de sauvegarde */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </div>
    </div>
  );
}
```

---

## 🔄 Migration Automatique des Images Existantes

Pour migrer automatiquement une image WordPress vers Supabase lors de l'édition :

```tsx
const migrateProductImage = async (wordpressUrl: string) => {
  try {
    const response = await fetch('/api/storage/migrate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: wordpressUrl,
        bucket: 'product-images',
        folder: 'products',
      }),
    });

    const result = await response.json();

    if (result.success && result.migrated) {
      // Mettre à jour le produit avec la nouvelle URL
      setProduct({ ...product, image_url: result.url });
      toast.success('Image migrée vers Supabase');
    } else if (result.success && !result.migrated) {
      // L'image est déjà sur Supabase
      toast.info('Image déjà hébergée sur Supabase');
    }
  } catch (error) {
    console.error('Migration failed:', error);
  }
};
```

---

## 🎨 Composant Galerie avec Réorganisation

Exemple avancé avec drag & drop (nécessite une bibliothèque comme `react-beautiful-dnd`) :

```tsx
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

function ProductGallery({ images, onChange }) {
  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(images);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    onChange(items);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="gallery" direction="horizontal">
        {(provided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="grid grid-cols-4 gap-4"
          >
            {images.map((url, index) => (
              <Draggable key={url} draggableId={url} index={index}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                  >
                    <ImageUploader
                      value={url}
                      onChange={(newUrl) => {
                        const newImages = [...images];
                        newImages[index] = newUrl;
                        onChange(newImages);
                      }}
                      bucket="product-images"
                      folder="products/gallery"
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
```

---

## 🛠️ Script de Migration Batch

Pour migrer toutes les images de produits d'un coup :

```tsx
// app/admin/products/migrate-images/page.tsx
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase-client';

export default function MigrateProductImages() {
  const [migrating, setMigrating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [log, setLog] = useState<string[]>([]);

  const migrateAllImages = async () => {
    setMigrating(true);
    setLog([]);
    setProgress(0);

    try {
      // Récupérer tous les produits avec images WordPress
      const { data: products, error } = await supabase
        .from('products')
        .select('id, woocommerce_id, name, image_url, images')
        .or('image_url.ilike.%wp.laboutiquedemorgane%,image_url.ilike.%webprocreation%');

      if (error) throw error;

      if (!products || products.length === 0) {
        toast.info('Aucune image WordPress à migrer');
        setMigrating(false);
        return;
      }

      const total = products.length;
      let migrated = 0;
      let failed = 0;

      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        setProgress(Math.round(((i + 1) / total) * 100));

        try {
          // Migrer l'image principale
          if (product.image_url?.includes('wp.laboutiquedemorgane') ||
              product.image_url?.includes('webprocreation')) {

            const response = await fetch('/api/storage/migrate-image', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                url: product.image_url,
                bucket: 'product-images',
                folder: `products/${product.woocommerce_id}`,
              }),
            });

            const result = await response.json();

            if (result.success && result.migrated) {
              // Mettre à jour dans Supabase
              await supabase
                .from('products')
                .update({ image_url: result.url })
                .eq('id', product.id);

              migrated++;
              setLog(prev => [...prev, `✓ ${product.name}: Image migrée`]);
            }
          }

          // Migrer les images de la galerie si nécessaire
          if (Array.isArray(product.images)) {
            const migratedImages: string[] = [];

            for (const img of product.images) {
              const imgUrl = typeof img === 'string' ? img : img.src;

              if (imgUrl?.includes('wp.laboutiquedemorgane') ||
                  imgUrl?.includes('webprocreation')) {

                const response = await fetch('/api/storage/migrate-image', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    url: imgUrl,
                    bucket: 'product-images',
                    folder: `products/${product.woocommerce_id}/gallery`,
                  }),
                });

                const result = await response.json();

                if (result.success) {
                  migratedImages.push(result.url);
                } else {
                  migratedImages.push(imgUrl); // Keep old URL if migration fails
                }
              } else {
                migratedImages.push(imgUrl); // Keep Supabase URL
              }
            }

            if (migratedImages.length > 0) {
              await supabase
                .from('products')
                .update({
                  images: migratedImages.map(url => ({ src: url }))
                })
                .eq('id', product.id);
            }
          }

        } catch (error) {
          failed++;
          setLog(prev => [...prev, `✗ ${product.name}: ${error}`]);
        }
      }

      toast.success(`Migration terminée: ${migrated} réussies, ${failed} échecs`);
    } catch (error) {
      toast.error('Erreur lors de la migration');
      console.error(error);
    } finally {
      setMigrating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Migration des Images Produits</h1>

      <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
        <p className="text-yellow-800">
          ⚠️ Cette opération va migrer toutes les images WordPress vers Supabase Storage.
          Les URLs dans la base de données seront mises à jour automatiquement.
        </p>
      </div>

      <Button
        onClick={migrateAllImages}
        disabled={migrating}
        size="lg"
        className="w-full"
      >
        {migrating ? 'Migration en cours...' : 'Lancer la Migration'}
      </Button>

      {migrating && (
        <div className="space-y-2">
          <Progress value={progress} className="w-full" />
          <p className="text-center text-sm text-gray-600">{progress}%</p>
        </div>
      )}

      {log.length > 0 && (
        <div className="bg-gray-50 rounded p-4 max-h-96 overflow-y-auto">
          <h2 className="font-semibold mb-2">Journal de migration</h2>
          <div className="space-y-1 font-mono text-xs">
            {log.map((entry, i) => (
              <div key={i} className={entry.startsWith('✓') ? 'text-green-600' : 'text-red-600'}>
                {entry}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 📋 Checklist d'Intégration

- [ ] Ajouter `ImageUploader` dans `/admin/products/[id]/page.tsx`
- [ ] Ajouter `ImageUploader` dans `/admin/products/create/page.tsx`
- [ ] Créer la page `/admin/products/migrate-images` pour migration batch
- [ ] Tester l'upload d'une nouvelle image
- [ ] Tester la modification d'une image existante
- [ ] Vérifier la compatibilité avec les anciennes URLs WordPress
- [ ] Tester la suppression d'images
- [ ] Documenter le processus pour l'équipe

---

## 🔗 Liens Utiles

- Documentation Supabase Storage: https://supabase.com/docs/guides/storage
- ImageUploader Component: `/components/ImageUploader.tsx`
- Upload API: `/app/api/storage/upload/route.ts`
- Migration API: `/app/api/storage/migrate-image/route.ts`
