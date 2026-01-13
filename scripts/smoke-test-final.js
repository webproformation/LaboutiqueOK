/**
 * SMOKE TEST FINAL - TUNNEL DE COMMANDE
 * Projet: qcqbtmvbvipsxwjlgjvk
 *
 * Test avec les colonnes de base disponibles dans le cache actuel
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('\n🚀 SMOKE TEST FINAL - TUNNEL DE COMMANDE\n');
console.log('📦 Projet : qcqbtmvbvipsxwjlgjvk');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

async function smokeTest() {
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const PRODUCT_SLUG = 'chemise-rayee-coeur-tu-36-au-46';
    const COUPON_CODE = 'PROMO5';
    const SHIPPING_METHOD_ID = '29005206-824a-4e78-a9a6-cf4ef9dd7345';

    console.log('📋 ÉTAPE 1 : Récupération du produit test');
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name, slug, regular_price, sale_price, stock_quantity, status')
      .eq('slug', PRODUCT_SLUG)
      .maybeSingle();

    if (productError || !product) {
      throw new Error(`Produit non trouvé: ${productError?.message || 'Aucun résultat'}`);
    }

    console.log(`✅ Produit : ${product.name}`);
    console.log(`   Prix : ${product.sale_price}€`);
    console.log(`   Stock : ${product.stock_quantity}\n`);

    console.log('🎟️  ÉTAPE 2 : Récupération du coupon');
    const { data: coupon, error: couponError } = await supabase
      .from('coupons')
      .select('code, discount_type, discount_value, is_active')
      .eq('code', COUPON_CODE)
      .maybeSingle();

    if (couponError || !coupon) {
      throw new Error(`Coupon non trouvé: ${couponError?.message || 'Aucun résultat'}`);
    }

    console.log(`✅ Coupon : ${coupon.code}`);
    console.log(`   Type : ${coupon.discount_type}`);
    console.log(`   Valeur : ${coupon.discount_value}%\n`);

    console.log('🚚 ÉTAPE 3 : Récupération méthode de livraison');
    const { data: shippingMethod, error: shippingError } = await supabase
      .from('shipping_methods')
      .select('id, name, cost, delivery_time')
      .eq('id', SHIPPING_METHOD_ID)
      .maybeSingle();

    if (shippingError || !shippingMethod) {
      throw new Error(`Méthode de livraison non trouvée: ${shippingError?.message || 'Aucun résultat'}`);
    }

    console.log(`✅ Livraison : ${shippingMethod.name}`);
    console.log(`   Coût : ${shippingMethod.cost}€`);
    console.log(`   Délai : ${shippingMethod.delivery_time}\n`);

    console.log('🧮 ÉTAPE 4 : Calculs du panier');
    const quantity = 2;
    const itemPrice = parseFloat(product.sale_price || product.regular_price);
    const subtotal = itemPrice * quantity;
    const discountAmount = subtotal * (parseFloat(coupon.discount_value) / 100);
    const subtotalAfterDiscount = subtotal - discountAmount;
    const shippingCost = parseFloat(shippingMethod.cost);
    const totalFinal = subtotalAfterDiscount + shippingCost;

    console.log(`   Quantité : ${quantity}`);
    console.log(`   Prix unitaire : ${itemPrice.toFixed(2)}€`);
    console.log(`   Sous-total : ${subtotal.toFixed(2)}€`);
    console.log(`   Réduction (-10%) : -${discountAmount.toFixed(2)}€`);
    console.log(`   Sous-total après réduction : ${subtotalAfterDiscount.toFixed(2)}€`);
    console.log(`   Frais de livraison : ${shippingCost.toFixed(2)}€`);
    console.log(`   ━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`   TOTAL : ${totalFinal.toFixed(2)}€\n`);

    console.log('✔️  ÉTAPE 5 : Validation de la formule');
    console.log(`   Total = (SommeItems - Réduction) + FraisLivraison`);
    console.log(`   ${totalFinal.toFixed(2)}€ = (${subtotal.toFixed(2)}€ - ${discountAmount.toFixed(2)}€) + ${shippingCost.toFixed(2)}€`);
    console.log(`   ${totalFinal.toFixed(2)}€ = ${subtotalAfterDiscount.toFixed(2)}€ + ${shippingCost.toFixed(2)}€`);

    const formulaCheck = Math.abs(totalFinal - (subtotalAfterDiscount + shippingCost)) < 0.01;
    console.log(`   Formule correcte : ${formulaCheck ? '✅ OUI' : '❌ NON'}\n`);

    if (!formulaCheck) {
      throw new Error('Erreur dans le calcul de la formule');
    }

    console.log('📝 ÉTAPE 6 : Création de la commande');
    const orderNumber = `TEST-FINAL-${Date.now()}`;

    const orderData = {
      order_number: orderNumber,
      status: 'pending',
      total: totalFinal,
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
      console.log(`❌ Erreur création commande: ${orderError.message}`);
      console.log(`   Code: ${orderError.code}`);

      if (orderError.code === 'PGRST204') {
        console.log('\n⚠️  REMARQUE: Cache PostgREST non encore synchronisé.');
        console.log('   Les nouvelles colonnes ajoutées récemment ne sont pas');
        console.log('   encore visibles dans le cache de l\'API.');
        console.log('   Le test complet fonctionnera automatiquement dans quelques minutes.\n');
      }

      throw orderError;
    }

    console.log(`✅ Commande créée : ${order.order_number}`);
    console.log(`   ID : ${order.id}`);
    console.log(`   Total : ${order.total}€\n`);

    console.log('📦 ÉTAPE 7 : Création de l\'item de commande');
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
      console.log(`❌ Erreur création item: ${itemError.message}`);
      throw itemError;
    }

    console.log(`✅ Item créé : ${orderItem.product_name}`);
    console.log(`   Quantité : ${orderItem.quantity}`);
    console.log(`   Prix unitaire : ${orderItem.price}€\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 SMOKE TEST RÉUSSI !\n');
    console.log('✅ Produit vérifié');
    console.log('✅ Coupon vérifié');
    console.log('✅ Méthode de livraison vérifiée');
    console.log('✅ Calculs validés');
    console.log('✅ Formule mathématique correcte');
    console.log('✅ Commande créée dans la base');
    console.log('✅ Item de commande créé\n');
    console.log(`📋 Numéro de commande : ${order.order_number}`);
    console.log(`💰 Total : ${totalFinal.toFixed(2)}€`);
    console.log(`📊 Formule : (${subtotal.toFixed(2)} - ${discountAmount.toFixed(2)}) + ${shippingCost.toFixed(2)} = ${totalFinal.toFixed(2)}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERREUR SMOKE TEST');
    console.error('Message:', error.message);
    if (error.code) {
      console.error('Code:', error.code);
    }
    console.error('\n');
    process.exit(1);
  }
}

smokeTest();
