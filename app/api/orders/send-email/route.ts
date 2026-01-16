import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    console.log('[SEND-EMAIL] Début de traitement...');
    const { orderId, pdfBase64, filename } = await request.json();
    console.log('[SEND-EMAIL] OrderId reçu:', orderId);

    if (!orderId || !pdfBase64) {
      console.error('[SEND-EMAIL] Données manquantes');
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('[SEND-EMAIL] Récupération de la commande...');
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .maybeSingle();

    if (orderError) {
      console.error('[SEND-EMAIL] Erreur récupération commande:', orderError);
      return NextResponse.json({ error: "Erreur commande", details: orderError.message }, { status: 500 });
    }

    if (!order) {
      console.error('[SEND-EMAIL] Commande non trouvée');
      return NextResponse.json({ error: "Commande non trouvée" }, { status: 404 });
    }

    console.log('[SEND-EMAIL] Commande trouvée:', order.order_number);

    console.log('[SEND-EMAIL] Récupération du profil utilisateur...');
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email, first_name, last_name")
      .eq("id", order.user_id)
      .maybeSingle();

    if (profileError) {
      console.error('[SEND-EMAIL] Erreur récupération profil:', profileError);
      return NextResponse.json({ error: "Erreur profil", details: profileError.message }, { status: 500 });
    }

    if (!profile || !profile.email) {
      console.error('[SEND-EMAIL] Email client introuvable, profil:', profile);
      return NextResponse.json({ error: "Email client introuvable" }, { status: 404 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profile.email)) {
      console.error('[SEND-EMAIL] Format email invalide:', profile.email);
      return NextResponse.json({ error: "Format email invalide" }, { status: 400 });
    }

    console.log('[SEND-EMAIL] Email destinataire:', profile.email);

    console.log('[SEND-EMAIL] Récupération des items de commande...');
    const { data: orderItems } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", orderId);

    console.log('[SEND-EMAIL] Items trouvés:', orderItems?.length || 0);

    // Enrichir les items avec les infos produit
    const enrichedItems = await Promise.all(
      (orderItems || []).map(async (item: any) => {
        const { data: product } = await supabase
          .from("products")
          .select("sku, image_url")
          .eq("id", item.product_id)
          .maybeSingle();

        let variationImage = null;
        if (item.variation_id) {
          const { data: variation } = await supabase
            .from("product_variations")
            .select("image_url")
            .eq("id", item.variation_id)
            .maybeSingle();
          variationImage = variation?.image_url;
        }

        const imageUrl = variationImage || product?.image_url || null;
        const fullImageUrl = imageUrl
          ? (imageUrl.startsWith('http') ? imageUrl : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media/${imageUrl}`)
          : null;

        return {
          ...item,
          sku: product?.sku,
          image_url: fullImageUrl,
        };
      })
    );

    console.log('[SEND-EMAIL] Configuration SMTP:', {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER ? '***' : 'MANQUANT',
      pass: process.env.SMTP_PASS ? '***' : 'MANQUANT',
      from: process.env.EMAIL_FROM ? '***' : 'MANQUANT'
    });

    const missingVars: string[] = [];
    if (!process.env.SMTP_HOST) missingVars.push('SMTP_HOST');
    if (!process.env.SMTP_PORT) missingVars.push('SMTP_PORT');
    if (!process.env.SMTP_USER) missingVars.push('SMTP_USER');
    if (!process.env.SMTP_PASS) missingVars.push('SMTP_PASS');

    if (missingVars.length > 0) {
      const errorMsg = `Configuration SMTP incomplète. Variables manquantes: ${missingVars.join(', ')}`;
      console.error('[SEND-EMAIL]', errorMsg);
      return NextResponse.json({
        error: errorMsg,
        missingVariables: missingVars
      }, { status: 500 });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'mail.laboutiquedemorgane.com',
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: false,
      },
    });

    console.log('[SEND-EMAIL] Test de connexion SMTP...');
    try {
      await transporter.verify();
      console.log('[SEND-EMAIL] Connexion SMTP OK');
    } catch (smtpError: any) {
      console.error('[SEND-EMAIL] Erreur connexion SMTP:', smtpError.message);
      return NextResponse.json({
        error: "Erreur connexion SMTP",
        details: smtpError.message
      }, { status: 500 });
    }

    const htmlEmail = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmation de commande</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">

          <!-- En-tête avec logo -->
          <tr>
            <td style="padding: 0; text-align: center; background-color: #000000;">
              <img src="${process.env.NEXT_PUBLIC_SITE_URL || 'https://laboutiquedemorgane.com'}/lbdm-logobdc.png" alt="La Boutique de Morgane" style="width: 100%; height: auto; display: block; max-height: 200px; object-fit: cover;" />
            </td>
          </tr>

          <!-- Contenu principal -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px; font-weight: 600;">
                Bonjour ${profile.first_name || ''} ${profile.last_name || ''} 👋
              </h2>

              <p style="margin: 0 0 20px 0; color: #555555; font-size: 16px; line-height: 1.6;">
                Nous avons le plaisir de vous confirmer la réception de votre commande
                <strong style="color: #d4af37;">#${order.order_number}</strong>.
              </p>

              <div style="background-color: #fef9e7; border-left: 4px solid #d4af37; padding: 20px; margin: 25px 0; border-radius: 4px;">
                <p style="margin: 0 0 20px 0; color: #333333; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                  Récapitulatif de votre commande
                </p>

                <!-- Liste des produits -->
                ${enrichedItems.map((item: any) => {
                  const variationText = item.variation_text || '';
                  const sku = item.sku ? `UGS: ${item.sku}` : '';
                  return `
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #e0e0e0;">
                  <tr>
                    <td width="80" style="vertical-align: top; padding-right: 15px;">
                      ${item.image_url ? `<img src="${item.image_url}" width="70" height="70" style="border-radius: 4px; object-fit: cover; display: block;" alt="${item.product_name}" />` : ''}
                    </td>
                    <td style="vertical-align: top;">
                      <p style="margin: 0 0 5px 0; color: #333333; font-size: 15px; font-weight: 600;">
                        ${item.product_name}
                      </p>
                      ${sku ? `<p style="margin: 0 0 5px 0; color: #888888; font-size: 12px;">${sku}</p>` : ''}
                      ${variationText ? `<p style="margin: 0 0 5px 0; color: #666666; font-size: 13px;">${variationText}</p>` : ''}
                      <p style="margin: 0; color: #666666; font-size: 13px;">
                        Quantité : ${item.quantity}
                      </p>
                    </td>
                    <td width="80" style="vertical-align: top; text-align: right;">
                      <p style="margin: 0; color: #d4af37; font-size: 16px; font-weight: 700;">
                        ${((item.price || 0) * (item.quantity || 1)).toFixed(2)} €
                      </p>
                    </td>
                  </tr>
                </table>
                  `;
                }).join('')}

                <table width="100%" cellpadding="8" cellspacing="0" style="margin-top: 20px; padding-top: 15px; border-top: 2px solid #d4af37;">
                  <tr>
                    <td style="color: #333333; font-size: 16px; font-weight: 700;">Montant total :</td>
                    <td style="color: #d4af37; font-size: 18px; font-weight: 700; text-align: right;">
                      ${(Number(order.total_amount) || Number(order.total) || 0).toFixed(2)} €
                    </td>
                  </tr>
                </table>
              </div>

              <p style="margin: 25px 0 15px 0; color: #555555; font-size: 15px; line-height: 1.6;">
                Vous trouverez ci-joint votre bon de commande détaillé au format PDF.
              </p>

              <p style="margin: 15px 0; color: #555555; font-size: 15px; line-height: 1.6;">
                Votre commande sera traitée dans les plus brefs délais. Vous recevrez un email de confirmation
                dès l'expédition de votre colis avec votre numéro de suivi.
              </p>
            </td>
          </tr>

          <!-- Section contact -->
          <tr>
            <td style="background-color: #fafafa; padding: 30px; border-top: 1px solid #eeeeee;">
              <p style="margin: 0 0 15px 0; color: #333333; font-size: 16px; font-weight: 600;">
                Une question ? Nous sommes là pour vous aider !
              </p>
              <table cellpadding="5" cellspacing="0">
                <tr>
                  <td style="color: #666666; font-size: 14px;">📧 Email :</td>
                  <td style="color: #d4af37; font-size: 14px; font-weight: 600;">
                    <a href="mailto:contact@laboutiquedemorgane.com" style="color: #d4af37; text-decoration: none;">
                      contact@laboutiquedemorgane.com
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="color: #666666; font-size: 14px;">📞 Morgane :</td>
                  <td style="color: #666666; font-size: 14px;">+33 6 41 45 66 71</td>
                </tr>
                <tr>
                  <td style="color: #666666; font-size: 14px;">📞 André :</td>
                  <td style="color: #666666; font-size: 14px;">+33 6 03 48 96 62</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Pied de page -->
          <tr>
            <td style="background-color: #333333; padding: 25px 30px; text-align: center;">
              <p style="margin: 0 0 8px 0; color: #ffffff; font-size: 14px; font-weight: 600;">
                MORGANE DEWANIN - SAS
              </p>
              <p style="margin: 0 0 8px 0; color: #cccccc; font-size: 12px;">
                1062 rue d'Armentières, 59850 Nieppe, France
              </p>
              <p style="margin: 0 0 8px 0; color: #cccccc; font-size: 11px;">
                SIREN : 907 889 802 | SIRET : 907 889 802 00027
              </p>
              <p style="margin: 0; color: #cccccc; font-size: 11px;">
                TVA : FR16907889802 | APE : 4641Z
              </p>
              <p style="margin: 15px 0 0 0; color: #999999; font-size: 10px; font-style: italic;">
                Shopping en live depuis 2020
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    if (order.newsletter_consent && process.env.BREVO_API_KEY) {
      console.log('[SEND-EMAIL] Inscription à la newsletter Brevo...');
      try {
        const brevoResponse = await fetch('https://api.brevo.com/v3/contacts', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'api-key': process.env.BREVO_API_KEY
          },
          body: JSON.stringify({
            email: profile.email,
            attributes: {
              PRENOM: profile.first_name || '',
              NOM: profile.last_name || ''
            },
            updateEnabled: true
          })
        });

        if (brevoResponse.ok) {
          console.log('[SEND-EMAIL] Contact ajouté à Brevo avec succès');
        } else if (brevoResponse.status === 409) {
          console.log('[SEND-EMAIL] Contact déjà présent dans Brevo (409), on continue');
        } else {
          const brevoError = await brevoResponse.text();
          console.warn('[SEND-EMAIL] Erreur Brevo (non bloquante):', brevoResponse.status, brevoError);
        }
      } catch (brevoError: any) {
        console.warn('[SEND-EMAIL] Erreur Brevo (non bloquante):', brevoError.message);
      }
    }

    console.log('[SEND-EMAIL] Envoi de l\'email...');
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"La Boutique de Morgane" <email@laboutiquedemorgane.com>',
      to: profile.email,
      subject: `Confirmation de votre commande #${order.order_number} - La Boutique de Morgane`,
      html: htmlEmail,
      attachments: [
        {
          filename: filename || `Commande_${order.order_number}.pdf`,
          content: pdfBase64,
          encoding: "base64",
        },
      ],
    };

    const mailResult = await transporter.sendMail(mailOptions);
    console.log('[SEND-EMAIL] Email envoyé avec succès, messageId:', mailResult.messageId);

    return NextResponse.json({
      success: true,
      message: "Email envoyé avec succès",
      messageId: mailResult.messageId
    });
  } catch (error: any) {
    console.error("[SEND-EMAIL] Erreur globale:", error);
    console.error("[SEND-EMAIL] Stack:", error.stack);
    return NextResponse.json(
      {
        error: "Erreur lors de l'envoi de l'email",
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
