import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function generateInvoiceHTML(order: any, invoiceNumber: string): string {
  const today = new Date().toLocaleDateString('fr-FR');
  const orderDate = new Date(order.date_created).toLocaleDateString('fr-FR');

  const lineItemsHTML = order.line_items.map((item: any) => `
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

  return `<!DOCTYPE html><html><body><div>${lineItemsHTML}</div></body></html>`;
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
        JSON.stringify({ success: true, invoice: existingInvoice, message: 'Invoice already exists' }),
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

    const pdfData = { html, invoiceNumber, orderId };
    const fileName = `invoices/${invoiceNumber}.json`;
    
    const { error: uploadError } = await supabaseClient.storage
      .from('order-documents')
      .upload(fileName, JSON.stringify(pdfData), { contentType: 'application/json', upsert: true });

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
      JSON.stringify({ success: true, invoice, html }),
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