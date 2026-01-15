import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to } = body;

    if (!to) {
      return NextResponse.json(
        { error: 'Email destinataire manquant' },
        { status: 400 }
      );
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to,
      subject: 'Test Technique - La Boutique de Morgane',
      text: 'Ceci est un test de configuration SMTP réussi depuis le site.',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d4af37;">Test SMTP - La Boutique de Morgane</h2>
          <p>Ceci est un test de configuration SMTP réussi depuis le site.</p>
          <hr style="border: 1px solid #d4af37;">
          <p style="color: #666; font-size: 12px;">Configuration testée le ${new Date().toLocaleString('fr-FR')}</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);

    return NextResponse.json({
      success: true,
      message: 'E-mail envoyé avec succès',
      messageId: info.messageId,
      response: info.response,
    });
  } catch (error: any) {
    console.error('Erreur envoi e-mail:', error);
    return NextResponse.json(
      {
        error: 'Erreur lors de l\'envoi de l\'e-mail',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
