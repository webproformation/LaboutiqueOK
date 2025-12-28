"use client";

import { useQuery } from '@apollo/client/react';
import { GET_PRODUCT_CATEGORIES } from '@/lib/queries';
import { GetProductCategoriesResponse } from '@/types';

export default function DebugCategoriesPage() {
  const { loading, data, error } = useQuery<GetProductCategoriesResponse>(GET_PRODUCT_CATEGORIES);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Debug Categories</h1>
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Debug Categories</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Erreur: {error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  const categories = data?.productCategories?.nodes || [];

  const findChildren = (parentId: string | null) => {
    return categories.filter(cat => cat.parentId === parentId);
  };

  const renderTree = (parentId: string | null, level: number = 0) => {
    const children = findChildren(parentId);

    if (children.length === 0) return null;

    return (
      <div className={`${level > 0 ? 'ml-8' : ''}`}>
        {children.map(cat => (
          <div key={cat.id} className="mb-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-bold text-lg">{cat.name}</h3>
                  <p className="text-sm text-gray-600">Slug: {cat.slug}</p>
                  <p className="text-sm text-gray-600">ID: {cat.id}</p>
                  <p className="text-sm text-gray-600">Parent ID: {cat.parentId || 'null (catégorie racine)'}</p>
                  <p className="text-sm text-gray-600">Produits: {cat.count}</p>
                  {cat.description && (
                    <p className="text-sm text-gray-600 mt-2">Description: {cat.description}</p>
                  )}
                </div>
                {cat.image?.sourceUrl && (
                  <img
                    src={cat.image.sourceUrl}
                    alt={cat.name}
                    className="w-20 h-20 object-cover rounded ml-4"
                  />
                )}
              </div>
            </div>
            {renderTree(cat.id, level + 1)}
          </div>
        ))}
      </div>
    );
  };

  const rootCategories = findChildren(null);
  const mainCategories = ['Mode', 'Maison', 'Beauté & Senteurs', 'Les looks de Morgane'];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Debug Categories</h1>
        <p className="text-gray-600 mb-8">Total: {categories.length} catégories</p>

        <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h2 className="font-bold mb-2">Catégories principales recherchées:</h2>
          <ul className="list-disc list-inside space-y-1">
            {mainCategories.map(name => {
              const found = categories.find(cat =>
                cat.name === name ||
                cat.name.toLowerCase() === name.toLowerCase() ||
                (name === 'Les looks de Morgane' && (
                  cat.slug === 'les-looks-de-morgane' ||
                  (cat.name.toLowerCase().includes('looks') && cat.name.toLowerCase().includes('morgane'))
                ))
              );
              return (
                <li key={name} className={found ? 'text-green-700' : 'text-red-700'}>
                  {name}: {found ? `✓ Trouvée (ID: ${found.id})` : '✗ Non trouvée'}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Catégories Racine ({rootCategories.length})</h2>
          {renderTree(null)}
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Toutes les catégories (liste)</h2>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Nom</th>
                  <th className="text-left p-2">Slug</th>
                  <th className="text-left p-2">ID</th>
                  <th className="text-left p-2">Parent ID</th>
                  <th className="text-left p-2">Produits</th>
                </tr>
              </thead>
              <tbody>
                {categories.map(cat => (
                  <tr key={cat.id} className="border-b">
                    <td className="p-2">{cat.name}</td>
                    <td className="p-2">{cat.slug}</td>
                    <td className="p-2 text-xs">{cat.id}</td>
                    <td className="p-2 text-xs">{cat.parentId || 'null'}</td>
                    <td className="p-2">{cat.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
