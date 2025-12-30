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
  returnType: 'credit' | 'refund';
  amount: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { to, firstName, returnNumber, returnType, amount }: RequestBody = await req.json();

    const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY');
    if (!BREVO_API_KEY) {
      throw new Error('BREVO_API_KEY not configured');
    }

    const isCreditType = returnType === 'credit';
    const typeMessage = isCreditType
      ? `Votre compte a été crédité de ${amount.toFixed(2)} €`
      : `Vous avez été remboursé de ${amount.toFixed(2)} €`;

    const emailContent = {
      sender: { name: "La Boutique de Morgane", email: "contact@laboutiquedemorgane.com" },
      to: [{ email: to, name: firstName }],
      subject: "Votre retour a été validé",
      htmlContent: `<p>Bonjour ${firstName},</p><p>Votre retour #${returnNumber} a été validé. ${typeMessage}.</p>`
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