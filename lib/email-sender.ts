import { Resend } from 'resend';
import { render } from '@react-email/render';
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

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = 'La Boutique de Morgane <noreply@laboutiqudemorgane.fr>';

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

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Bienvenue dans la famille, ${firstName} !`,
      html: emailHtml,
    });

    if (error) {
      console.error('Error sending welcome email:', error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
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

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Merci ${firstName} ! On s'occupe de tout 🎁`,
      html: emailHtml,
    });

    if (error) {
      console.error('Error sending order confirmation email:', error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
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

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `C'est parti ! Ton colis est ouvert pour 5 jours ⏱️`,
      html: emailHtml,
    });

    if (error) {
      console.error('Error sending open package start email:', error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
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

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Hop ! C'est ajouté dans ton carton 📦`,
      html: emailHtml,
    });

    if (error) {
      console.error('Error sending open package add email:', error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
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

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Ça y est ! Ton bonheur est en route 🚚`,
      html: emailHtml,
    });

    if (error) {
      console.error('Error sending shipping email:', error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
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

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Voisine, ta commande t'attend ! 🛍️`,
      html: emailHtml,
    });

    if (error) {
      console.error('Error sending click and collect email:', error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
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

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Oups ${firstName}... Tu as oublié ces beautés ? 😱`,
      html: emailHtml,
    });

    if (error) {
      console.error('Error sending abandoned cart email:', error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
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

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Dernière ligne droite ! Ton colis part demain ⏳`,
      html: emailHtml,
    });

    if (error) {
      console.error('Error sending package closing warning email:', error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
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

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Alors, le verdict ? (Et une surprise inside...) ⭐`,
      html: emailHtml,
    });

    if (error) {
      console.error('Error sending review request email:', error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
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

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Chut... Voici ton code secret 🤫`,
      html: emailHtml,
    });

    if (error) {
      console.error('Error sending password reset email:', error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
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

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `BRAVO ! Tu as trouvé un Diamant ! 💎`,
      html: emailHtml,
    });

    if (error) {
      console.error('Error sending diamond found email:', error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (error: any) {
    console.error('Error sending diamond found email:', error);
    return { success: false, error: error.message };
  }
}
