import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RequestBody {
  to: string;
  firstName: string;
  returnNumber: string;
  orderNumber: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { to, firstName, returnNumber, orderNumber }: RequestBody = await req.json();

    const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY');
    if (!BREVO_API_KEY) {
      throw new Error('BREVO_API_KEY not configured');
    }

    const emailContent = {
      sender: { name: "La Boutique de Morgane", email: "contact@laboutiquedemorgane.com" },
      to: [{ email: to, name: firstName }],
      subject: "Votre demande de retour est enregistrée",
      htmlContent: `<p>Bonjour ${firstName},</p><p>Votre demande de retour #${returnNumber} pour la commande #${orderNumber} a été enregistrée.</p>`
    };

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'api-key': BREVO_API_KEY },
      body: JSON.stringify(emailContent)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Brevo API error: ${error}`);
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Email envoyé avec succès' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});