import { render } from '@react-email/render';
import { transporter, FROM_EMAIL } from './email';
import { WelcomeEmail } from '@/components/emails/WelcomeEmail';
import { OrderConfirmationEmail } from '@/components/emails/OrderConfirmationEmail';
import { OpenPackageStartEmail } from '@/components/emails/OpenPackageStartEmail';
import { OpenPackageAddEmail } from '@/components/emails/OpenPackageAddEmail';
import { ShippingEmail } from '@/components/emails/ShippingEmail';
import { ClickAndCollectEmail } from '@/components/emails/ClickAndCollectEmail';
import { AbandonedCartEmail } from '@/components/emails/AbandonedCartEmail';
import { PackageClosingWarningEmail } from '@/components/emails/PackageClosingWarningEmail';
import { ReviewRequestEmail } from '@/components/emails/ReviewRequestEmail';
import { PasswordResetEmail } from '@/components/emails/PasswordResetEmail';
import { DiamondFoundEmail } from '@/components/emails/DiamondFoundEmail';

interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendWelcomeEmail(
  to: string,
  firstName: string
): Promise<SendEmailResult> {
  try {
    const emailHtml = await render(WelcomeEmail({ firstName }));

    const info = await transporter.sendMail({
      from: FROM_EMAIL,
      to,
      subject: `Bienvenue dans la famille, ${firstName} !`,
      html: emailHtml,
    });

    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('Error sending welcome email:', error);
    return { success: false, error: error.message };
  }
}

export async function sendOrderConfirmationEmail(
  to: string,
  firstName: string,
  orderNumber: string,
  items: any[],
  total: number
): Promise<SendEmailResult> {
  try {
    const emailHtml = await render(OrderConfirmationEmail({
      firstName,
      orderNumber,
      items,
      total
    }));

    const info = await transporter.sendMail({
      from: FROM_EMAIL,
      to,
      subject: `Merci ${firstName} ! On s'occupe de tout 🎁`,
      html: emailHtml,
    });

    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('Error sending order confirmation email:', error);
    return { success: false, error: error.message };
  }
}

export async function sendOpenPackageStartEmail(
  to: string,
  firstName: string,
  orderNumber: string,
  closingDate: string
): Promise<SendEmailResult> {
  try {
    const emailHtml = await render(OpenPackageStartEmail({
      firstName,
      orderNumber,
      closingDate
    }));

    const info = await transporter.sendMail({
      from: FROM_EMAIL,
      to,
      subject: `C'est parti ! Ton colis est ouvert pour 5 jours ⏱️`,
      html: emailHtml,
    });

    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('Error sending open package start email:', error);
    return { success: false, error: error.message };
  }
}

export async function sendOpenPackageAddEmail(
  to: string,
  firstName: string,
  orderNumber: string,
  closingDate: string
): Promise<SendEmailResult> {
  try {
    const emailHtml = await render(OpenPackageAddEmail({
      firstName,
      orderNumber,
      closingDate
    }));

    const info = await transporter.sendMail({
      from: FROM_EMAIL,
      to,
      subject: `Hop ! C'est ajouté dans ton carton 📦`,
      html: emailHtml,
    });

    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('Error sending open package add email:', error);
    return { success: false, error: error.message };
  }
}

export async function sendShippingEmail(
  to: string,
  firstName: string,
  trackingNumber: string,
  trackingUrl?: string
): Promise<SendEmailResult> {
  try {
    const emailHtml = await render(ShippingEmail({
      firstName,
      trackingNumber,
      trackingUrl
    }));

    const info = await transporter.sendMail({
      from: FROM_EMAIL,
      to,
      subject: `Ça y est ! Ton bonheur est en route 🚚`,
      html: emailHtml,
    });

    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('Error sending shipping email:', error);
    return { success: false, error: error.message };
  }
}

export async function sendClickAndCollectEmail(
  to: string,
  firstName: string
): Promise<SendEmailResult> {
  try {
    const emailHtml = await render(ClickAndCollectEmail({ firstName }));

    const info = await transporter.sendMail({
      from: FROM_EMAIL,
      to,
      subject: `Voisine, ta commande t'attend ! 🛍️`,
      html: emailHtml,
    });

    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('Error sending click and collect email:', error);
    return { success: false, error: error.message };
  }
}

export async function sendAbandonedCartEmail(
  to: string,
  firstName: string
): Promise<SendEmailResult> {
  try {
    const emailHtml = await render(AbandonedCartEmail({ firstName }));

    const info = await transporter.sendMail({
      from: FROM_EMAIL,
      to,
      subject: `Oups ${firstName}... Tu as oublié ces beautés ? 😱`,
      html: emailHtml,
    });

    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('Error sending abandoned cart email:', error);
    return { success: false, error: error.message };
  }
}

export async function sendPackageClosingWarningEmail(
  to: string,
  firstName: string
): Promise<SendEmailResult> {
  try {
    const emailHtml = await render(PackageClosingWarningEmail({ firstName }));

    const info = await transporter.sendMail({
      from: FROM_EMAIL,
      to,
      subject: `Dernière ligne droite ! Ton colis part demain ⏳`,
      html: emailHtml,
    });

    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('Error sending package closing warning email:', error);
    return { success: false, error: error.message };
  }
}

export async function sendReviewRequestEmail(
  to: string,
  firstName: string
): Promise<SendEmailResult> {
  try {
    const emailHtml = await render(ReviewRequestEmail({ firstName }));

    const info = await transporter.sendMail({
      from: FROM_EMAIL,
      to,
      subject: `Alors, le verdict ? (Et une surprise inside...) ⭐`,
      html: emailHtml,
    });

    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('Error sending review request email:', error);
    return { success: false, error: error.message };
  }
}

export async function sendPasswordResetEmail(
  to: string,
  resetLink: string
): Promise<SendEmailResult> {
  try {
    const emailHtml = await render(PasswordResetEmail({ resetLink }));

    const info = await transporter.sendMail({
      from: FROM_EMAIL,
      to,
      subject: `Chut... Voici ton code secret 🤫`,
      html: emailHtml,
    });

    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('Error sending password reset email:', error);
    return { success: false, error: error.message };
  }
}

export async function sendDiamondFoundEmail(
  to: string,
  firstName: string,
  amount: number
): Promise<SendEmailResult> {
  try {
    const emailHtml = await render(DiamondFoundEmail({ firstName, amount }));

    const info = await transporter.sendMail({
      from: FROM_EMAIL,
      to,
      subject: `BRAVO ! Tu as trouvé un Diamant ! 💎`,
      html: emailHtml,
    });

    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('Error sending diamond found email:', error);
    return { success: false, error: error.message };
  }
}
