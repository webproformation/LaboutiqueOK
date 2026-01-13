'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

export default function TestOrderPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const runSmokeTest = async () => {
    setLoading(true);
    setResult(null);

    try {
      const productSlug = 'test-total-system-001';
      const couponCode = 'TEST2026';
      const shippingMethodId = '2371a631-c416-45bb-8a8f-97a88a19c915';

      console.log('🚀 SMOKE TEST TUNNEL DE COMMANDE');

      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('slug', productSlug)
        .single();

      if (productError || !product) {
        throw new Error('Produit test non trouvé');
      }

      console.log('✅ Produit:', product.name);

      const { data: coupon, error: couponError } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode)
        .single();

      if (couponError || !coupon) {
        throw new Error('Coupon non trouvé');
      }

      console.log('✅ Coupon:', coupon.code);

      const { data: shippingMethod, error: shippingError } = await supabase
        .from('shipping_methods')
        .select('*')
        .eq('id', shippingMethodId)
        .single();

      if (shippingError || !shippingMethod) {
        throw new Error('Méthode de livraison non trouvée');
      }

      console.log('✅ Livraison:', shippingMethod.name);

      const quantity = 2;
      const itemPrice = parseFloat(product.sale_price || product.regular_price);
      const subtotal = itemPrice * quantity;
      const discountAmount = subtotal * (parseFloat(coupon.discount_value) / 100);
      const subtotalAfterDiscount = subtotal - discountAmount;
      const shippingCost = parseFloat(shippingMethod.cost);
      const totalFinal = subtotalAfterDiscount + shippingCost;

      console.log('🧮 Calculs:');
      console.log('  Subtotal:', subtotal);
      console.log('  Discount:', discountAmount);
      console.log('  Shipping:', shippingCost);
      console.log('  TOTAL:', totalFinal);

      const orderNumber = `TEST-${Date.now()}`;
      const orderData = {
        order_number: orderNumber,
        status: 'pending',
        total: totalFinal,
        items: [{
          product_id: product.id,
          product_name: product.name,
          quantity: quantity,
          price: itemPrice
        }],
        shipping_address: {
          street: '123 rue de Test',
          city: 'Paris',
          postal_code: '75001',
          country: 'France'
        }
      };

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError) {
        throw new Error(`Erreur création commande: ${orderError.message}`);
      }

      console.log('✅ Commande créée:', order.order_number);

      const itemData = {
        order_id: order.id,
        product_name: product.name,
        product_slug: product.slug,
        product_image: product.image_url,
        price: itemPrice.toString(),
        quantity: quantity
      };

      const { data: orderItem, error: itemError } = await supabase
        .from('order_items')
        .insert(itemData)
        .select()
        .single();

      if (itemError) {
        throw new Error(`Erreur création item: ${itemError.message}`);
      }

      console.log('✅ Item créé:', orderItem.product_name);

      const testResult = {
        success: true,
        order_number: order.order_number,
        order_id: order.id,
        product_name: product.name,
        quantity: quantity,
        unit_price: itemPrice,
        subtotal: subtotal,
        discount: discountAmount,
        shipping: shippingCost,
        total: totalFinal,
        coupon: coupon.code,
        formula: `(${subtotal.toFixed(2)} - ${discountAmount.toFixed(2)}) + ${shippingCost.toFixed(2)} = ${totalFinal.toFixed(2)}`
      };

      setResult(testResult);
      toast.success(`Commande ${order.order_number} créée avec succès ! Total: ${totalFinal.toFixed(2)}€`, {
        position: 'bottom-right',
        duration: 5000
      });

    } catch (error: any) {
      console.error('❌ Erreur:', error);
      const errorResult = {
        success: false,
        error: error.message
      };
      setResult(errorResult);
      toast.error(`Erreur: ${error.message}`, {
        position: 'bottom-right',
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10 px-4">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>🧪 Smoke Test - Tunnel de Commande</CardTitle>
          <CardDescription>
            Test complet du processus de commande (qcqbtmvbvipsxwjlgjvk)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold">Scénario de test :</h3>
            <ul className="list-disc pl-6 space-y-2 text-sm text-gray-600">
              <li>Produit : Produit Test Tunnel Commande (79.99€)</li>
              <li>Quantité : 2</li>
              <li>Coupon : TEST2026 (-10%)</li>
              <li>Livraison : LIVRAISON EXPRESS (12.50€)</li>
            </ul>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm font-mono">
                <strong>Formule :</strong> Total = (Subtotal - Réduction) + Livraison
              </p>
              <p className="text-sm font-mono mt-2">
                Total = (159.98€ - 15.99€) + 12.50€ = <strong>156.49€</strong>
              </p>
            </div>
          </div>

          <Button
            onClick={runSmokeTest}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? 'Test en cours...' : '🚀 Lancer le Smoke Test'}
          </Button>

          {result && (
            <div className={`p-4 rounded-lg ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              {result.success ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🎉</span>
                    <h3 className="text-lg font-semibold text-green-800">Test Réussi !</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p><strong>📋 Numéro de commande :</strong> {result.order_number}</p>
                    <p><strong>🆔 ID commande :</strong> {result.order_id}</p>
                    <p><strong>📦 Produit :</strong> {result.product_name}</p>
                    <p><strong>🔢 Quantité :</strong> {result.quantity}</p>
                    <p><strong>💵 Prix unitaire :</strong> {result.unit_price.toFixed(2)}€</p>
                    <p><strong>🧮 Sous-total :</strong> {result.subtotal.toFixed(2)}€</p>
                    <p><strong>🎟️ Réduction :</strong> -{result.discount.toFixed(2)}€ ({result.coupon})</p>
                    <p><strong>🚚 Frais de port :</strong> {result.shipping.toFixed(2)}€</p>
                    <hr className="my-2" />
                    <p className="text-lg"><strong>💰 TOTAL :</strong> {result.total.toFixed(2)}€</p>
                    <p className="text-xs text-gray-600 mt-2">Formule : {result.formula}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">❌</span>
                    <h3 className="text-lg font-semibold text-red-800">Test Échoué</h3>
                  </div>
                  <p className="text-sm text-red-700">{result.error}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
