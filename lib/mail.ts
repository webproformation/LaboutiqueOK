import nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'mail.laboutiquedemorgane.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
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

export async function sendEmail(options: EmailOptions) {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'La Boutique de Morgane <email@laboutiquedemorgane.com>',
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function sendOrderConfirmationEmail(
  to: string,
  orderData: {
    orderId: string;
    customerName: string;
    items: Array<{ name: string; quantity: number; price: number }>;
    total: number;
    shippingAddress: string;
  }
) {
  const itemsList = orderData.items
    .map(
      (item) =>
        `<tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${item.price.toFixed(2)} €</td>
        </tr>`
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirmation de commande</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <tr>
                <td style="padding: 0; text-align: center; background-color: #000000;">
                  <img src="${process.env.NEXT_PUBLIC_SITE_URL || 'https://laboutiquedemorgane.com'}/lbdm-logobdc.png" alt="La Boutique de Morgane" style="width: 100%; height: auto; display: block; max-height: 200px; object-fit: cover;" />
                </td>
              </tr>
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="color: #333333; margin: 0 0 20px 0;">Merci pour votre commande !</h2>
                  <p style="color: #666666; line-height: 1.6; margin: 0 0 20px 0;">
                    Bonjour ${orderData.customerName},
                  </p>
                  <p style="color: #666666; line-height: 1.6; margin: 0 0 20px 0;">
                    Nous avons bien reçu votre commande <strong>#${orderData.orderId}</strong> et nous vous remercions de votre confiance.
                  </p>

                  <h3 style="color: #333333; margin: 30px 0 15px 0;">Détails de la commande</h3>
                  <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #eee; border-radius: 4px; overflow: hidden;">
                    <thead>
                      <tr style="background-color: #f8f8f8;">
                        <th style="padding: 10px; text-align: left; color: #333;">Produit</th>
                        <th style="padding: 10px; text-align: center; color: #333;">Quantité</th>
                        <th style="padding: 10px; text-align: right; color: #333;">Prix</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${itemsList}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colspan="2" style="padding: 15px 10px; text-align: right; font-weight: bold; color: #333;">Total :</td>
                        <td style="padding: 15px 10px; text-align: right; font-weight: bold; color: #333; font-size: 18px;">${orderData.total.toFixed(2)} €</td>
                      </tr>
                    </tfoot>
                  </table>

                  <h3 style="color: #333333; margin: 30px 0 15px 0;">Adresse de livraison</h3>
                  <p style="color: #666666; line-height: 1.6; margin: 0 0 20px 0; background-color: #f8f8f8; padding: 15px; border-radius: 4px;">
                    ${orderData.shippingAddress.replace(/\n/g, '<br>')}
                  </p>

                  <p style="color: #666666; line-height: 1.6; margin: 30px 0 0 0;">
                    Votre commande sera traitée dans les plus brefs délais. Vous recevrez un email de confirmation d'expédition dès que votre colis sera parti.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="background-color: #f8f8f8; padding: 20px 30px; text-align: center;">
                  <p style="color: #999999; margin: 0; font-size: 12px;">
                    © ${new Date().getFullYear()} La Boutique de Morgane - Tous droits réservés
                  </p>
                  <p style="color: #999999; margin: 10px 0 0 0; font-size: 12px;">
                    Pour toute question, contactez-nous à <a href="mailto:email@laboutiquedemorgane.com" style="color: #666666;">email@laboutiquedemorgane.com</a>
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

  const text = `
    Merci pour votre commande !

    Bonjour ${orderData.customerName},

    Nous avons bien reçu votre commande #${orderData.orderId}.

    Détails de la commande :
    ${orderData.items.map((item) => `- ${item.name} x${item.quantity} : ${item.price.toFixed(2)} €`).join('\n')}

    Total : ${orderData.total.toFixed(2)} €

    Adresse de livraison :
    ${orderData.shippingAddress}

    Votre commande sera traitée dans les plus brefs délais.

    La Boutique de Morgane
  `;

  return sendEmail({
    to,
    subject: `Confirmation de commande #${orderData.orderId}`,
    html,
    text,
  });
}

export async function verifyConnection() {
  try {
    await transporter.verify();
    return { success: true, message: 'Connexion SMTP établie avec succès' };
  } catch (error) {
    console.error('SMTP connection error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur de connexion SMTP',
    };
  }
}
