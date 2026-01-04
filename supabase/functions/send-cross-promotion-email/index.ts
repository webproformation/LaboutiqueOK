import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface EmailRequest {
  userEmail: string;
  userName: string;
  couponCode: string;
  couponType: 'live_to_site' | 'site_to_live';
  expiryDate: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const brevoApiKey = Deno.env.get('BREVO_API_KEY');
    if (!brevoApiKey) {
      throw new Error('BREVO_API_KEY not configured');
    }

    const { userEmail, userName, couponCode, couponType, expiryDate }: EmailRequest = await req.json();

    const subject = couponType === 'live_to_site'
      ? 'Une petite surprise t\'attend sur le site !'
      : 'Rejoins-nous en live pour ta prochaine commande !';

    const htmlContent = `<p>Bonjour ${userName},</p><p>Voici votre code promo: ${couponCode}</p><p>Valable jusqu'au ${new Date(expiryDate).toLocaleDateString('fr-FR')}</p>`;

    const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'accept': 'application/json', 'api-key': brevoApiKey, 'content-type': 'application/json' },
      body: JSON.stringify({
        sender: { name: 'La Boutique de Morgane', email: 'noreply@laboutiquedemorgane.fr' },
        to: [{ email: userEmail, name: userName }],
        subject: subject,
        htmlContent: htmlContent
      })
    });

    if (!brevoResponse.ok) {
      const errorData = await brevoResponse.text();
      throw new Error(`Brevo API error: ${errorData}`);
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Email sent successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error sending email:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});