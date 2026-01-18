import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const { invoiceId } = await req.json();

    // 1. VÉRIFICATION CLÉ
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      return NextResponse.json({ error: "ERREUR CONFIG : Clé SUPABASE_SERVICE_ROLE_KEY manquante." }, { status: 500 });
    }

    // 2. ADMIN CLIENT
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey
    );

    // 3. RÉCUPÉRATION
    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from('invoices')
      .select('*, orders:order_id ( * )') 
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      console.error("Erreur DB:", invoiceError);
      return NextResponse.json({ error: `Erreur récupération facture: ${invoiceError?.message}` }, { status: 404 });
    }

    // 4. RECHERCHE INTELLIGENTE DE L'EMAIL
    let clientEmail = invoice.orders?.email || invoice.orders?.guest_email || invoice.orders?.contact_email;

    if (!clientEmail && invoice.orders?.user_id) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('email')
        .eq('id', invoice.orders.user_id)
        .single();
      clientEmail = profile?.email;
    }

    if (!clientEmail) {
      if (invoice.orders?.shipping_address?.email) {
         clientEmail = invoice.orders.shipping_address.email;
      } else {
         return NextResponse.json({ error: "Aucun email trouvé pour ce client." }, { status: 400 });
      }
    }

    // 5. CONFIG SMTP
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false, 
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: { rejectUnauthorized: false }
    });

    // 6. DESIGN DU MAIL (NOIR & OR)
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background-color: #000000; padding: 20px; text-align: center; }
          .logo { color: #D4AF37; font-size: 24px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; text-decoration: none; }
          .content { padding: 40px 30px; color: #333333; line-height: 1.6; }
          .h1 { color: #000000; font-size: 22px; margin-bottom: 20px; text-align: center; }
          .invoice-box { background-color: #f9f9f9; border: 1px solid #e0e0e0; padding: 20px; margin: 20px 0; border-radius: 5px; }
          .amount { color: #D4AF37; font-size: 24px; font-weight: bold; }
          .btn { display: inline-block; background-color: #D4AF37; color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 20px; text-align: center; }
          .footer { background-color: #000000; color: #888888; padding: 20px; text-align: center; font-size: 12px; }
          .footer a { color: #D4AF37; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">La Boutique de Morgane</div>
          </div>
          
          <div class="content">
            <h1 class="h1">Votre facture est disponible</h1>
            
            <p>Bonjour ${invoice.customer_name},</p>
            <p>Nous vous remercions pour votre confiance ! Voici la facture correspondant à votre commande récente.</p>
            
            <div class="invoice-box" style="text-align: center;">
              <p style="margin: 0; color: #666;">Facture N°</p>
              <p style="margin: 5px 0 15px 0; font-weight: bold;">${invoice.invoice_number}</p>
              
              <p style="margin: 0; color: #666;">Montant Total</p>
              <p class="amount">${parseFloat(invoice.amount).toFixed(2)} €</p>
            </div>

            <p style="text-align: center;">
              Vous trouverez votre facture en pièce jointe de cet email, ou vous pouvez la télécharger directement :
            </p>
            
            <div style="text-align: center;">
              <a href="${invoice.pdf_url}" class="btn">Télécharger ma facture PDF</a>
            </div>
            
            <p style="margin-top: 30px; text-align: center; font-style: italic; color: #666;">
              "Votre dose de style et de joie !"<br>
              À très vite en Live, Morgane.
            </p>
          </div>

          <div class="footer">
            <p>MORGANE DEWANIN - SAS au capital variable</p>
            <p>1062 rue d'Armentières, 59850 Nieppe, France</p>
            <p>SIREN: 907 889 802 - TVA: FR16907889802</p>
            <p><a href="https://laboutiquedemorgane.com">www.laboutiquedemorgane.com</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    // 7. ENVOI
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"La Boutique de Morgane" <contact@laboutiquedemorgane.com>',
      to: clientEmail,
      subject: `Votre facture ${invoice.invoice_number} est disponible`,
      html: emailHtml,
      attachments: [
        {
          filename: `${invoice.invoice_number}.pdf`,
          path: invoice.pdf_url
        }
      ]
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Erreur serveur:', error);
    return NextResponse.json({ error: "Erreur technique : " + error.message }, { status: 500 });
  }
}