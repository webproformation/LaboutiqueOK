import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY');

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (!BREVO_API_KEY) {
      console.error('BREVO_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { invoiceId, resend } = await req.json();

    if (!invoiceId) {
      return new Response(
        JSON.stringify({ error: 'Invoice ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: invoice, error: invoiceError } = await supabaseClient
      .from('order_invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      return new Response(
        JSON.stringify({ error: 'Invoice not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (invoice.sent_at && !resend) {
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Invoice already sent',
          sent_at: invoice.sent_at
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const fileName = `invoices/${invoice.invoice_number}.json`;
    const { data: fileData, error: downloadError } = await supabaseClient.storage
      .from('order-documents')
      .download(fileName);

    if (downloadError || !fileData) {
      return new Response(
        JSON.stringify({ error: 'Invoice file not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const fileText = await fileData.text();
    const invoiceData = JSON.parse(fileText);

    const emailData = {
      sender: {
        name: "La Boutique de Morgane",
        email: "contact@laboutiquedemorgane.com"
      },
      to: [{ email: invoice.customer_email }],
      subject: `Votre bon de commande ${invoice.invoice_number} - La Boutique de Morgane`,
      htmlContent: `<div>${invoiceData.html}</div>`
    };

    const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify(emailData)
    });

    if (!brevoResponse.ok) {
      const errorData = await brevoResponse.text();
      return new Response(
        JSON.stringify({ error: 'Failed to send email', details: errorData }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    await supabaseClient
      .from('order_invoices')
      .update({ sent_at: new Date().toISOString() })
      .eq('id', invoiceId);

    return new Response(
      JSON.stringify({ success: true, message: 'Invoice email sent successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error sending invoice email:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});