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
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const brevoApiKey = Deno.env.get('BREVO_API_KEY');
    if (!brevoApiKey) {
      throw new Error('BREVO_API_KEY not configured');
    }

    const { userEmail, userName, couponCode, couponType, expiryDate }: EmailRequest = await req.json();

    let subject: string;
    let htmlContent: string;

    if (couponType === 'live_to_site') {
      subject = 'Une petite surprise t\'attend sur le site ! 🎁';
      htmlContent = `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #4F46E5;">Coucou ${userName} !</h2>
              <p>Tu as fait tes achats en live et on adore ça ! 💜</p>
              <p>Pour te remercier, voici un petit cadeau :</p>
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px; text-align: center; margin: 30px 0;">
                <h3 style="color: white; margin: 0;">Ton Code Promo</h3>
                <p style="color: white; font-size: 24px; font-weight: bold; letter-spacing: 2px; margin: 10px 0;">${couponCode}</p>
                <p style="color: white; margin: 0;">2 € de réduction dès 10 € d'achat</p>
              </div>
              <p><strong>Où l'utiliser ?</strong> Uniquement sur notre site web (hors live et replay)</p>
              <p><strong>Valable jusqu'au :</strong> ${new Date(expiryDate).toLocaleDateString('fr-FR')}</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://laboutiquedemorgane.fr" style="background-color: #4F46E5; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Découvrir le Site</a>
              </div>
              <p style="font-size: 12px; color: #666; margin-top: 30px;">À bientôt sur le site !<br>L'équipe Morgane 🥰</p>
            </div>
          </body>
        </html>
      `;
    } else {
      subject = 'Rejoins-nous en live pour ta prochaine commande ! ✨';
      htmlContent = `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #4F46E5;">Coucou ${userName} !</h2>
              <p>Merci pour ta commande sur le site ! 💜</p>
              <p>Tu sais quoi ? Nos lives sont encore plus fun et interactifs ! Pour t'encourager à nous rejoindre, voici un petit cadeau :</p>
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px; text-align: center; margin: 30px 0;">
                <h3 style="color: white; margin: 0;">Ton Code Promo Live</h3>
                <p style="color: white; font-size: 24px; font-weight: bold; letter-spacing: 2px; margin: 10px 0;">${couponCode}</p>
                <p style="color: white; margin: 0;">2 € de réduction dès 10 € d'achat</p>
              </div>
              <p><strong>Où l'utiliser ?</strong> Uniquement en live ou en replay</p>
              <p><strong>Valable jusqu'au :</strong> ${new Date(expiryDate).toLocaleDateString('fr-FR')}</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://laboutiquedemorgane.fr/live" style="background-color: #4F46E5; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Voir les Lives</a>
              </div>
              <p style="font-size: 12px; color: #666; margin-top: 30px;">À très vite en live !<br>L'équipe Morgane 🥰</p>
            </div>
          </body>
        </html>
      `;
    }

    const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': brevoApiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: 'La Boutique de Morgane',
          email: 'noreply@laboutiquedemorgane.fr'
        },
        to: [
          {
            email: userEmail,
            name: userName
          }
        ],
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
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error sending email:', error);
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