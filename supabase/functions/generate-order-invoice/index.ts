import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface OrderData {
  id: number;
  number: string;
  status: string;
  date_created: string;
  billing: {
    first_name: string;
    last_name: string;
    company: string;
    address_1: string;
    address_2: string;
    city: string;
    postcode: string;
    country: string;
    email: string;
    phone: string;
  };
  shipping: {
    first_name: string;
    last_name: string;
    company: string;
    address_1: string;
    address_2: string;
    city: string;
    postcode: string;
    country: string;
  };
  line_items: Array<{
    name: string;
    quantity: number;
    price: number;
    subtotal: string;
    total: string;
    sku: string;
  }>;
  shipping_lines: Array<{
    method_title: string;
    total: string;
  }>;
  total: string;
  total_tax: string;
  shipping_total: string;
  discount_total: string;
  payment_method_title: string;
}

function generateInvoiceHTML(order: OrderData, invoiceNumber: string): string {
  const today = new Date().toLocaleDateString('fr-FR');
  const orderDate = new Date(order.date_created).toLocaleDateString('fr-FR');

  const lineItemsHTML = order.line_items.map(item => `
    <tr>
      <td style="padding: 4px 6px; border-bottom: 1px solid #e5e7eb; font-size: 9px;">
        ${item.name}<br>
        <small style="color: #6b7280; font-size: 8px;">SKU: ${item.sku || 'N/A'}</small>
      </td>
      <td style="padding: 4px 6px; border-bottom: 1px solid #e5e7eb; text-align: center; font-size: 9px;">${item.quantity}</td>
      <td style="padding: 4px 6px; border-bottom: 1px solid #e5e7eb; text-align: right; font-size: 9px;">${parseFloat(item.price).toFixed(2)} €</td>
      <td style="padding: 4px 6px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600; font-size: 9px;">${parseFloat(item.total).toFixed(2)} €</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bon de commande ${invoiceNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1f2937; line-height: 1.3; background: white; font-size: 10px; }
    .container { max-width: 800px; margin: 0 auto; padding: 10px 15px; }
    .logo-header { margin-bottom: 10px; text-align: center; }
    .logo-header img { width: 100%; max-width: 600px; height: auto; display: block; margin: 0 auto; }
    .header { background: linear-gradient(135deg, #b8933d 0%, #a07c2f 100%); color: white; padding: 12px 15px; border-radius: 6px; margin-bottom: 10px; }
    .header h1 { font-size: 18px; margin-bottom: 6px; text-align: center; }
    .header-info { display: flex; justify-content: space-between; margin-top: 8px; font-size: 9px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
    .info-section { background: white; padding: 8px 10px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e5e7eb; font-size: 9px; }
    .info-section h3 { color: #b8933d; font-size: 11px; margin-bottom: 6px; border-bottom: 1px solid #b8933d; padding-bottom: 3px; }
    table { width: 100%; border-collapse: collapse; background: white; border-radius: 6px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 10px; border: 1px solid #e5e7eb; }
    thead { background: #f9fafb; }
    th { padding: 6px; text-align: left; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb; font-size: 10px; }
    .totals { background: white; padding: 8px 10px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 10px; max-width: 300px; margin-left: auto; border: 1px solid #e5e7eb; }
    .totals-row { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #e5e7eb; font-size: 9px; }
    .totals-row.total { font-size: 12px; font-weight: 700; color: #b8933d; border-bottom: none; padding-top: 6px; border-top: 1px solid #b8933d; }
    .legal { background: #f9fafb; padding: 8px 10px; border-radius: 6px; font-size: 8px; color: #6b7280; margin-top: 10px; border: 1px solid #e5e7eb; line-height: 1.3; }
    .legal h3 { color: #374151; font-size: 10px; margin-bottom: 4px; }
    .footer { text-align: center; margin-top: 10px; padding-top: 8px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 8px; line-height: 1.4; }
    @media print { body { background: white; } .container { padding: 8px; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo-header">
      <img src="https://laboutiquedemorgane.com/logo-bdc.png" alt="La Boutique de Morgane" onerror="this.style.display='none'" />
    </div>

    <div class="header">
      <h1>BON DE COMMANDE</h1>
      <div class="header-info">
        <div>
          <strong>N° de commande:</strong> ${order.number}<br>
          <strong>N° de facture:</strong> ${invoiceNumber}
        </div>
        <div style="text-align: right;">
          <strong>Date de commande:</strong> ${orderDate}<br>
          <strong>Date d'émission:</strong> ${today}
        </div>
      </div>
    </div>

    <div class="info-grid">
      <div class="info-section">
        <h3>Facturation</h3>
        <p>
          <strong>${order.billing.first_name} ${order.billing.last_name}</strong><br>
          ${order.billing.company ? order.billing.company + '<br>' : ''}
          ${order.billing.address_1}<br>
          ${order.billing.address_2 ? order.billing.address_2 + '<br>' : ''}
          ${order.billing.postcode} ${order.billing.city}<br>
          ${order.billing.country}<br>
          <strong>Email:</strong> ${order.billing.email}<br>
          <strong>Tél:</strong> ${order.billing.phone}
        </p>
      </div>

      <div class="info-section">
        <h3>Livraison</h3>
        <p>
          <strong>${order.shipping.first_name} ${order.shipping.last_name}</strong><br>
          ${order.shipping.company ? order.shipping.company + '<br>' : ''}
          ${order.shipping.address_1}<br>
          ${order.shipping.address_2 ? order.shipping.address_2 + '<br>' : ''}
          ${order.shipping.postcode} ${order.shipping.city}<br>
          ${order.shipping.country}
        </p>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Produit</th>
          <th style="text-align: center; width: 100px;">Quantité</th>
          <th style="text-align: right; width: 120px;">Prix unitaire</th>
          <th style="text-align: right; width: 120px;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${lineItemsHTML}
      </tbody>
    </table>

    <div class="totals">
      <div class="totals-row">
        <span>Sous-total:</span>
        <span>${(parseFloat(order.total) - parseFloat(order.shipping_total || '0') - parseFloat(order.total_tax || '0')).toFixed(2)} €</span>
      </div>
      ${order.discount_total && parseFloat(order.discount_total) > 0 ? `
      <div class="totals-row">
        <span>Réduction:</span>
        <span>-${parseFloat(order.discount_total).toFixed(2)} €</span>
      </div>
      ` : ''}
      ${order.shipping_total && parseFloat(order.shipping_total) > 0 ? `
      <div class="totals-row">
        <span>Frais de port:</span>
        <span>${parseFloat(order.shipping_total).toFixed(2)} €</span>
      </div>
      ` : ''}
      ${order.total_tax && parseFloat(order.total_tax) > 0 ? `
      <div class="totals-row">
        <span>TVA:</span>
        <span>${parseFloat(order.total_tax).toFixed(2)} €</span>
      </div>
      ` : ''}
      <div class="totals-row total">
        <span>TOTAL TTC:</span>
        <span>${parseFloat(order.total).toFixed(2)} €</span>
      </div>
    </div>

    <div class="info-section">
      <h3>Mode de paiement</h3>
      <p>${order.payment_method_title}</p>
    </div>

    <div class="legal">
      <h3>Mentions légales</h3>
      <p>
        <strong>Conditions:</strong> CGV disponibles sur www.laboutiquedemorgane.com •
        <strong>Rétractation:</strong> 14 jours •
        <strong>Garanties:</strong> Légale de conformité et vices cachés •
        <strong>RGPD:</strong> Données protégées •
        <strong>Litiges:</strong> Médiation disponible
      </p>
    </div>

    <div class="footer">
      <p><strong>LA BOUTIQUE DE MORGANE</strong> - 1062 rue d'Armentières, 59850 Nieppe</p>
      <p>www.laboutiquedemorgane.com | contact@laboutiquedemorgane.com | Morgane: +33 6 41 45 66 71</p>
      <p>SIRET: 907 889 802 00027 | TVA: FR16907889802 | NAF: 4641Z</p>
    </div>
  </div>
</body>
</html>
  `;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { orderId, orderData } = await req.json();

    if (!orderId || !orderData) {
      return new Response(
        JSON.stringify({ error: 'Order ID and data are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: existingInvoice } = await supabaseClient
      .from('order_invoices')
      .select('*')
      .eq('woocommerce_order_id', orderId)
      .single();

    if (existingInvoice) {
      return new Response(
        JSON.stringify({ 
          success: true,
          invoice: existingInvoice,
          message: 'Invoice already exists'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: invoiceNumberData, error: invoiceNumberError } = await supabaseClient
      .rpc('generate_invoice_number');

    if (invoiceNumberError) {
      throw new Error(`Failed to generate invoice number: ${invoiceNumberError.message}`);
    }

    const invoiceNumber = invoiceNumberData as string;

    const html = generateInvoiceHTML(orderData, invoiceNumber);

    const pdfData = {
      html,
      invoiceNumber,
      orderId
    };

    const fileName = `invoices/${invoiceNumber}.json`;
    const { error: uploadError } = await supabaseClient.storage
      .from('order-documents')
      .upload(fileName, JSON.stringify(pdfData), {
        contentType: 'application/json',
        upsert: true
      });

    if (uploadError) {
      throw new Error(`Failed to upload invoice: ${uploadError.message}`);
    }

    const { data: urlData } = supabaseClient.storage
      .from('order-documents')
      .getPublicUrl(fileName);

    const { data: invoice, error: insertError } = await supabaseClient
      .from('order_invoices')
      .insert({
        order_number: orderData.number,
        woocommerce_order_id: orderId,
        pdf_url: urlData.publicUrl,
        invoice_number: invoiceNumber,
        customer_email: orderData.billing.email,
        generated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to save invoice record: ${insertError.message}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        invoice,
        html
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error generating invoice:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});