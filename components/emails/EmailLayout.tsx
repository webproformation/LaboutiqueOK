import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Hr
} from '@react-email/components';
import * as React from 'react';

interface EmailLayoutProps {
  preview: string;
  children: React.ReactNode;
}

export const EmailLayout = ({ preview, children }: EmailLayoutProps) => {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Img
              src="https://laboutiquedemorgane.com/lbdm-logobdc.png"
              width="200"
              height="auto"
              alt="La Boutique de Morgane"
              style={logo}
            />
          </Section>

          <Section style={content}>
            {children}
          </Section>

          <Hr style={hr} />

          <Section style={footer}>
            <Text style={footerText}>
              <strong>La Boutique de Morgane</strong><br />
              1062 Rue d'Armentières<br />
              59850 Nieppe, France
            </Text>
            <Text style={footerText}>
              📧 <Link href="mailto:laboutiquededoudou@gmail.com" style={link}>laboutiquededoudou@gmail.com</Link>
            </Text>
            <Text style={footerText}>
              📱 Doudou: <Link href="tel:+33603489662" style={link}>06 03 48 96 62</Link> |
              Morgane: <Link href="tel:+33641456671" style={link}>06 41 45 66 71</Link>
            </Text>
            <Text style={footerText}>
              Suivez-nous sur <Link href="https://facebook.com" style={link}>Facebook</Link> et <Link href="https://instagram.com" style={link}>Instagram</Link>
            </Text>
            <Text style={footerTextSmall}>
              Vous recevez cet e-mail car vous avez un compte sur laboutiqudemorgane.fr<br />
              <Link href="{{{unsubscribe}}}" style={link}>Se désabonner des e-mails marketing</Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0',
  maxWidth: '600px',
};

const header = {
  textAlign: 'center' as const,
  padding: '20px 0',
  backgroundColor: '#000000',
};

const logo = {
  margin: '0 auto',
};

const content = {
  padding: '30px 20px',
  backgroundColor: '#ffffff',
};

const footer = {
  padding: '20px',
  textAlign: 'center' as const,
  backgroundColor: '#f5f5f5',
};

const footerText = {
  fontSize: '14px',
  color: '#666666',
  lineHeight: '1.6',
  margin: '10px 0',
};

const footerTextSmall = {
  fontSize: '12px',
  color: '#999999',
  lineHeight: '1.6',
  margin: '10px 0',
};

const link = {
  color: '#D4AF37',
  textDecoration: 'none',
};

const hr = {
  borderColor: '#e6e6e6',
  margin: '20px 0',
};

export default EmailLayout;
