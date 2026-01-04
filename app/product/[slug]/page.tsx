'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase, Product } from '@/lib/supabase';
import { ArrowLeft, ShoppingBag, Check, X } from 'lucide-react';

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProduct();
  }, [slug]);

  async function loadProduct() {
    try {
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (productError) throw productError;

      if (!productData) {
        router.push('/');
        return;
      }

      setProduct(productData);
    } catch (error) {
      console.error('Error loading product:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-slate-600">Chargement...</div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  const displayPrice = product.sale_price || product.regular_price;
  const hasDiscount = product.sale_price && product.sale_price < product.regular_price;
  const allImages = product.images && product.images.length > 0
    ? product.images
    : [{ src: product.image_url, alt: product.name }];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <ShoppingBag className="w-8 h-8 text-slate-800" />
              <h1 className="text-3xl font-bold text-slate-900">La Boutique de Morgane</h1>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link
          href="/"
          className="inline-flex items-center text-slate-600 hover:text-slate-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Retour aux produits
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-4">
            <div className="aspect-square relative overflow-hidden rounded-xl bg-slate-100 shadow-lg">
              <img
                src={allImages[selectedImage]?.src || product.image_url}
                alt={allImages[selectedImage]?.alt || product.name}
                className="w-full h-full object-cover"
              />
              {product.stock_status === 'outofstock' && (
                <div className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                  Épuisé
                </div>
              )}
              {hasDiscount && (
                <div className="absolute top-4 left-4 bg-green-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                  Promo
                </div>
              )}
            </div>

            {allImages.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === idx
                        ? 'border-slate-900 shadow-md'
                        : 'border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    <img
                      src={img.src}
                      alt={img.alt}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-4">
                {product.name}
              </h1>

              <div className="flex items-baseline gap-4 mb-6">
                {hasDiscount && (
                  <span className="text-2xl text-slate-400 line-through">
                    {product.regular_price.toFixed(2)} €
                  </span>
                )}
                <span className="text-5xl font-bold text-slate-900">
                  {displayPrice.toFixed(2)} €
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 py-4 border-y border-slate-200">
              {product.stock_status === 'instock' ? (
                <div className="flex items-center text-green-600">
                  <Check className="w-5 h-5 mr-2" />
                  <span className="font-semibold">En stock</span>
                </div>
              ) : (
                <div className="flex items-center text-red-600">
                  <X className="w-5 h-5 mr-2" />
                  <span className="font-semibold">Épuisé</span>
                </div>
              )}

              {product.stock_quantity > 0 && product.stock_quantity < 5 && (
                <span className="text-orange-600 font-medium">
                  Plus que {product.stock_quantity} en stock
                </span>
              )}
            </div>

            {product.short_description && (
              <div className="bg-slate-50 rounded-lg p-6">
                <p className="text-slate-700 leading-relaxed">
                  {product.short_description}
                </p>
              </div>
            )}

            {product.stock_status === 'instock' && (
              <button className="w-full bg-slate-900 text-white py-4 px-8 rounded-lg hover:bg-slate-800 transition-colors text-lg font-semibold shadow-lg">
                Ajouter au panier
              </button>
            )}

            {product.description && (
              <div className="pt-6 border-t border-slate-200">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">
                  Description
                </h2>
                <div
                  className="prose prose-slate max-w-none"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              </div>
            )}

            {product.attributes && product.attributes.length > 0 && (
              <div className="pt-6 border-t border-slate-200">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">
                  Caractéristiques
                </h2>
                <dl className="space-y-2">
                  {product.attributes.map((attr: any, idx: number) => (
                    <div key={idx} className="flex justify-between py-2 border-b border-slate-100">
                      <dt className="font-semibold text-slate-700">{attr.name}</dt>
                      <dd className="text-slate-600">{attr.option || attr.options?.join(', ')}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-slate-600">
            © 2026 La Boutique de Morgane. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
}
