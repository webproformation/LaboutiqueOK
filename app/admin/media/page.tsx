"use client";

import MediaLibrary from "@/components/MediaLibrary";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function MediaAdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-[#b8933d] to-[#d4af37] bg-clip-text text-transparent">
          Médiathèque
        </h1>
        <p className="text-gray-600 mt-2 text-lg">
          Gérez tous vos médias en un seul endroit. Toutes les images sont automatiquement converties en WebP.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-[#d4af37]">Images des produits</CardTitle>
          <CardDescription>
            Bibliothèque unifiée pour toutes les images de produits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MediaLibrary
            bucket="product-images"
            onSelect={(url) => {
              console.log('Image sélectionnée:', url);
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-[#d4af37]">Images des catégories</CardTitle>
          <CardDescription>
            Images utilisées pour les bannières et vignettes des catégories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MediaLibrary
            bucket="category-images"
            onSelect={(url) => {
              console.log('Image sélectionnée:', url);
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
