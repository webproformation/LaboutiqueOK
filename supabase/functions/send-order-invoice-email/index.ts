import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

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

    // Get invoice details
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

    // Check if already sent and not a resend
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

    // Get invoice HTML
    const fileName = `invoices/${invoice.invoice_number}.json`;
    const { data: fileData, error: downloadError } = await supabaseClient.storage
      .from('order-documents')
      .download(fileName);

    if (downloadError) {
      console.error('Download error:', downloadError);
      return new Response(
        JSON.stringify({
          error: 'Invoice file not found',
          details: downloadError.message
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!fileData) {
      return new Response(
        JSON.stringify({ error: 'Invoice file is empty' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let invoiceData;
    try {
      const fileText = await fileData.text();
      invoiceData = JSON.parse(fileText);

      if (!invoiceData.html) {
        return new Response(
          JSON.stringify({ error: 'Invoice HTML content is missing' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (parseError: any) {
      console.error('Parse error:', parseError);
      return new Response(
        JSON.stringify({
          error: 'Failed to parse invoice data',
          details: parseError.message
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send email via Brevo
    const emailData = {
      sender: {
        name: "La Boutique de Morgane",
        email: "contact@laboutiquedemorgane.com"
      },
      to: [
        {
          email: invoice.customer_email,
          name: invoice.customer_email
        }
      ],
      subject: `Votre bon de commande ${invoice.invoice_number} - La Boutique de Morgane`,
      htmlContent: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #b8933d 0%, #a07c2f 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">Votre commande est confirmée !</h1>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
            <p style="font-size: 16px; color: #1f2937; margin-bottom: 20px;">
              Bonjour,
            </p>
            
            <p style="font-size: 16px; color: #1f2937; margin-bottom: 20px;">
              Merci pour votre commande <strong>${invoice.order_number}</strong> passée sur La Boutique de Morgane !
            </p>
            
            <p style="font-size: 16px; color: #1f2937; margin-bottom: 20px;">
              Votre commande est actuellement <strong>en cours de traitement</strong>. Vous recevrez une notification dès qu'elle sera expédiée.
            </p>
            
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 30px 0;">
              <h2 style="color: #b8933d; font-size: 18px; margin-top: 0;">Détails de votre commande</h2>
              <p style="margin: 5px 0; color: #374151;">
                <strong>Numéro de commande:</strong> ${invoice.order_number}<br>
                <strong>Numéro de facture:</strong> ${invoice.invoice_number}<br>
                <strong>Date:</strong> ${new Date(invoice.generated_at).toLocaleDateString('fr-FR')}
              </p>
            </div>
            
            <p style="font-size: 16px; color: #1f2937; margin-bottom: 20px;">
              Vous trouverez ci-dessous votre bon de commande détaillé. Vous pouvez également accéder à tous vos documents dans votre espace client sur notre site.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://www.laboutiquedemorgane.com/account/orders" 
                 style="display: inline-block; background: #b8933d; color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                Voir ma commande
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            ${invoiceData.html}
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
              Pour toute question concernant votre commande, n'hésitez pas à nous contacter à <a href="mailto:contact@laboutiquedemorgane.com" style="color: #b8933d;">contact@laboutiquedemorgane.com</a>
            </p>
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
              Merci de votre confiance,<br>
              <strong>L'équipe de La Boutique de Morgane</strong>
            </p>
          </div>
        </div>
      `
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
      console.error('Brevo API error:', {
        status: brevoResponse.status,
        statusText: brevoResponse.statusText,
        body: errorData
      });
      return new Response(
        JSON.stringify({
          error: 'Failed to send email',
          details: `Brevo returned ${brevoResponse.status}: ${errorData}`
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update sent_at timestamp
    const { error: updateError } = await supabaseClient
      .from('order_invoices')
      .update({ sent_at: new Date().toISOString() })
      .eq('id', invoiceId);

    if (updateError) {
      console.error('Failed to update sent_at:', updateError);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Invoice email sent successfully'
      }),
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