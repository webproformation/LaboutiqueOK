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
      host: process.env.SMTP_HOST || 'mail.laboutiquedemorgane.com',
      port: Number(process.env.SMTP_PORT || 587),
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
          <p style="color: #666; font-size: 12px;">Port: ${process.env.SMTP_PORT || 587} (TLS/STARTTLS)</p>
        </div>
      `,
    };

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('TIMEOUT')), 15000)
    );

    const sendPromise = transporter.sendMail(mailOptions);

    const info = await Promise.race([sendPromise, timeoutPromise]);

    return NextResponse.json({
      success: true,
      message: 'E-mail envoyé avec succès',
      messageId: info.messageId,
      response: info.response,
    });
  } catch (error: any) {
    console.error('Erreur envoi e-mail:', error);

    let errorMessage = 'Erreur lors de l\'envoi de l\'e-mail';
    let errorDetails = error.message || 'Erreur inconnue';
    let errorCode = error.code || '';

    if (error.message === 'TIMEOUT' || errorCode === 'ETIMEDOUT' || errorCode === 'ESOCKET') {
      errorMessage = 'Timeout de connexion SMTP';
      errorDetails = 'La connexion au serveur SMTP a pris trop de temps. Vérifiez que le serveur SMTP est accessible depuis Vercel et que le port 587 est bien ouvert.';
    } else if (errorCode === 'ECONNREFUSED') {
      errorMessage = 'Connexion refusée';
      errorDetails = 'Le serveur SMTP a refusé la connexion. Vérifiez que le port 587 est accessible depuis Vercel.';
    } else if (errorCode === 'ENOTFOUND') {
      errorMessage = 'Serveur SMTP introuvable';
      errorDetails = `Impossible de résoudre le nom de domaine: ${process.env.SMTP_HOST}`;
    } else if (errorCode === 'EAUTH') {
      errorMessage = 'Erreur d\'authentification';
      errorDetails = 'Les identifiants SMTP sont incorrects ou l\'authentification a échoué.';
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: errorDetails,
        code: errorCode,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        smtp_config: {
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT || 587,
          secure: false,
          tls: 'STARTTLS (port 587)',
          user: process.env.SMTP_USER,
        },
      },
      { status: 504 }
    );
  }
}
