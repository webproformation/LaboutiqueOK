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
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { to, firstName, returnNumber, returnType, amount }: RequestBody = await req.json();

    const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY');
    if (!BREVO_API_KEY) {
      throw new Error('BREVO_API_KEY not configured');
    }

    const isCreditType = returnType === 'credit';
    
    const typeMessage = isCreditType
      ? `<p>Votre Porte-monnaie client vient d'être crédité de <strong>${amount.toFixed(2)} €</strong>. Cette somme se déduira automatiquement de votre prochaine commande. Profitez-en bien !</p>`
      : `<p>Nous avons procédé au remboursement de <strong>${amount.toFixed(2)} €</strong> sur votre moyen de paiement initial. Il apparaîtra sur votre compte bancaire sous quelques jours selon les délais de votre banque.</p>`;

    const emailContent = {
      sender: {
        name: "La Boutique de Morgane",
        email: "contact@laboutiquedemorgane.com"
      },
      to: [{ email: to, name: firstName }],
      subject: "Votre retour a été validé ! 🎁",
      htmlContent: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #C6A15B 0%, #B7933F 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
              .success-box { background: #d4edda; border-left: 4px solid #28a745; padding: 20px; margin: 20px 0; border-radius: 5px; }
              .amount { font-size: 32px; font-weight: bold; color: #C6A15B; text-align: center; margin: 20px 0; }
              .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✨ Retour Validé ! ✨</h1>
              </div>
              <div class="content">
                <p>Bonjour ${firstName},</p>
                
                <div class="success-box">
                  <strong>🎉 Bonne nouvelle !</strong><br>
                  Votre colis de retour est bien arrivé et a été validé par notre équipe.
                </div>
                
                <div class="amount">
                  ${amount.toFixed(2)} €
                </div>
                
                ${typeMessage}
                
                <p style="margin-top: 30px;">Merci pour votre confiance et à bientôt pour de nouvelles pépites !</p>
                
                <p style="margin-top: 30px;">Morgane 🌸</p>
              </div>
              <div class="footer">
                <p>La Boutique de Morgane<br>
                1062 Rue d'Armentières, 59850 Nieppe<br>
                contact@laboutiquedemorgane.com</p>
              </div>
            </div>
          </body>
        </html>
      `
    };

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY
      },
      body: JSON.stringify(emailContent)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Brevo API error: ${error}`);
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Email envoyé avec succès' }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});