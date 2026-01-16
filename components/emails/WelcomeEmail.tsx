import { Heading, Text, Button, Section } from '@react-email/components';
import * as React from 'react';
import { EmailLayout } from './EmailLayout';

interface WelcomeEmailProps {
  firstName: string;
}

export const WelcomeEmail = ({ firstName }: WelcomeEmailProps) => {
  return (
    <EmailLayout preview={`Bienvenue dans la famille, ${firstName} !`}>
      <Heading style={h1}>Bienvenue dans la famille, {firstName} ! 💕</Heading>

      <Text style={paragraph}>
        Coucou {firstName} !
      </Text>

      <Text style={paragraph}>
        Ça y est, tu fais officiellement partie de la <strong>Team Morgane</strong> !
        On est trop contents de t'accueillir ici.
      </Text>

      <Text style={paragraph}>
        Ici, on ne se prend pas la tête : <strong>du 34 au 54, tout le monde a le droit d'être canon</strong>.
      </Text>

      <Section style={box}>
        <Text style={boxTitle}>Ce qui t'attend sur le site :</Text>
        <Text style={paragraph}>
          💎 Des pépites mode dénichées avec amour<br />
          🕯️ Les créations parfumées de l'Atelier de Doudou<br />
          🕵️‍♀️ <strong>Le Jeu des Diamants</strong> : Ouvre l'œil, il y a des diamants cachés sur le site pour gagner des sous dans ta cagnotte !
        </Text>
      </Section>

      <Button href={process.env.NEXT_PUBLIC_SITE_URL || 'https://laboutiqudemorgane.fr'} style={button}>
        Je découvre la boutique
      </Button>

      <Text style={paragraph}>
        Hâte de préparer ta première commande !
      </Text>

      <Text style={signature}>
        À très vite,<br />
        <strong>Morgane & Doudou</strong> ✨
      </Text>
    </EmailLayout>
  );
};

const h1 = {
  color: '#333',
  fontSize: '28px',
  fontWeight: 'bold',
  marginBottom: '20px',
  textAlign: 'center' as const,
};

const paragraph = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '16px 0',
};

const box = {
  backgroundColor: '#FFF9E6',
  border: '2px solid #D4AF37',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 0',
};

const boxTitle = {
  color: '#D4AF37',
  fontSize: '18px',
  fontWeight: 'bold',
  marginBottom: '12px',
};

const button = {
  backgroundColor: '#D4AF37',
  borderRadius: '5px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 30px',
  margin: '20px 0',
};

const signature = {
  color: '#666',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '30px 0 0 0',
  fontStyle: 'italic',
};

export default WelcomeEmail;
