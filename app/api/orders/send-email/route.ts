import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const { orderId, pdfBase64, filename } = await request.json();

    if (!orderId || !pdfBase64) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .maybeSingle();

    if (orderError || !order) {
      return NextResponse.json({ error: "Commande non trouvée" }, { status: 404 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("email, first_name, last_name")
      .eq("id", order.user_id)
      .maybeSingle();

    if (!profile || !profile.email) {
      return NextResponse.json({ error: "Email client introuvable" }, { status: 404 });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "465"),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

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
            <td style="background: linear-gradient(135deg, #d4af37 0%, #b8933d 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: 1px;">
                La Boutique de Morgane
              </h1>
              <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 14px; opacity: 0.95; font-style: italic;">
                Votre dose de style et de joie
              </p>
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
                <p style="margin: 0 0 10px 0; color: #333333; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                  Récapitulatif de votre commande
                </p>
                <table width="100%" cellpadding="8" cellspacing="0" style="margin-top: 15px;">
                  <tr>
                    <td style="color: #666666; font-size: 14px; padding: 8px 0;">Date de commande :</td>
                    <td style="color: #333333; font-size: 14px; font-weight: 600; text-align: right; padding: 8px 0;">
                      ${new Date(order.created_at).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric"
                      })}
                    </td>
                  </tr>
                  <tr>
                    <td style="color: #666666; font-size: 14px; padding: 8px 0;">Nombre d'articles :</td>
                    <td style="color: #333333; font-size: 14px; font-weight: 600; text-align: right; padding: 8px 0;">
                      ${(order.items || []).reduce((sum: number, item: any) => sum + (item.quantity || 0), 0)}
                    </td>
                  </tr>
                  <tr style="border-top: 2px solid #d4af37;">
                    <td style="color: #333333; font-size: 16px; font-weight: 700; padding: 12px 0;">Montant total :</td>
                    <td style="color: #d4af37; font-size: 18px; font-weight: 700; text-align: right; padding: 12px 0;">
                      ${(order.total || 0).toFixed(2)} €
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

    await transporter.sendMail({
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
    });

    return NextResponse.json({
      success: true,
      message: "Email envoyé avec succès",
    });
  } catch (error: any) {
    console.error("Erreur envoi email:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi de l'email", details: error.message },
      { status: 500 }
    );
  }
}
