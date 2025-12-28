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
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { to, firstName, returnNumber, orderNumber }: RequestBody = await req.json();

    const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY');
    if (!BREVO_API_KEY) {
      throw new Error('BREVO_API_KEY not configured');
    }

    const emailContent = {
      sender: {
        name: "La Boutique de Morgane",
        email: "contact@laboutiquedemorgane.com"
      },
      to: [{ email: to, name: firstName }],
      subject: "Votre demande de retour est enregistrée ✨",
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
              .info-box { background: #f8f9fa; border-left: 4px solid #C6A15B; padding: 15px; margin: 20px 0; }
              .warning { background: #fff3cd; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0; color: #856404; }
              .steps { margin: 20px 0; }
              .step { margin: 15px 0; padding-left: 30px; position: relative; }
              .step:before { content: "✓"; position: absolute; left: 0; color: #C6A15B; font-weight: bold; font-size: 20px; }
              .address { font-weight: bold; margin: 10px 0; }
              .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Demande de Retour Enregistrée</h1>
              </div>
              <div class="content">
                <p>Bonjour ${firstName},</p>
                
                <p>Nous avons bien reçu votre déclaration de retour pour la commande <strong>#${orderNumber}</strong>.</p>
                
                <div class="info-box">
                  <strong>Numéro de retour :</strong> ${returnNumber}
                </div>
                
                <h3>Rappel de la marche à suivre :</h3>
                
                <div class="steps">
                  <div class="step">Glissez vos pépites (neuves et étiquetées) dans leur emballage.</div>
                  <div class="step">Joignez votre numéro de commande à l'intérieur.</div>
                  <div class="step">Renvoyez le colis à l'adresse ci-dessous.</div>
                </div>
                
                <div class="address">
                  La Boutique de Morgane<br>
                  1062 Rue d'Armentières<br>
                  59850 Nieppe
                </div>
                
                <div class="warning">
                  <strong>⚠️ IMPORTANT :</strong> Livraison directe uniquement, pas de Point Relais ou Locker.
                </div>
                
                <p>Dès que nous recevrons votre colis et après vérification de vos articles, nous validerons votre avoir ou remboursement sous 14 jours.</p>
                
                <p>À très vite sur la boutique !</p>
                
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