import { Heading, Text, Button, Section } from '@react-email/components';
import * as React from 'react';
import { EmailLayout } from './EmailLayout';

interface OpenPackageStartEmailProps {
  firstName: string;
  orderNumber: string;
  closingDate: string;
}

export const OpenPackageStartEmail = ({
  firstName,
  orderNumber,
  closingDate
}: OpenPackageStartEmailProps) => {
  return (
    <EmailLayout preview={`C'est parti ! Ton colis est ouvert pour 5 jours ⏱️`}>
      <Heading style={h1}>C'est parti ! 🎉</Heading>

      <Text style={paragraph}>
        Génial {firstName} !
      </Text>

      <Text style={paragraph}>
        Ta commande <strong>#{orderNumber}</strong> est validée et tes articles sont mis de côté au chaud dans notre atelier.
      </Text>

      <Text style={paragraph}>
        Comme tu as choisi l'option <strong>"Colis Ouvert"</strong>, tu ne paies les frais de port qu'une seule fois maintenant.
      </Text>

      <Section style={timerBox}>
        <Text style={timerIcon}>⏱️</Text>
        <Text style={timerTitle}>Le Chrono est lancé !</Text>
        <Text style={timerText}>
          Tu as <strong>5 jours</strong> pour ajouter d'autres merveilles à ce colis sans repayer de livraison.
        </Text>
        <Text style={dateText}>
          Date de fermeture automatique :<br />
          <strong style={{ fontSize: '20px', color: '#D4AF37' }}>{closingDate}</strong>
        </Text>
      </Section>

      <Text style={paragraph}>
        Prends le temps de flâner, on garde tout ça précieusement pour toi.
      </Text>

      <Button href={process.env.NEXT_PUBLIC_SITE_URL || 'https://laboutiqudemorgane.fr'} style={button}>
        Continuer mes achats
      </Button>

      <Text style={signature}>
        À très vite pour la suite,<br />
        <strong>Morgane</strong> ✨
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

const timerBox = {
  backgroundColor: '#E8F4FD',
  border: '2px solid #4A90E2',
  borderRadius: '8px',
  padding: '30px',
  margin: '30px 0',
  textAlign: 'center' as const,
};

const timerIcon = {
  fontSize: '48px',
  margin: '0 0 10px 0',
};

const timerTitle = {
  color: '#4A90E2',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '10px 0',
};

const timerText = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '15px 0',
};

const dateText = {
  color: '#666',
  fontSize: '16px',
  margin: '20px 0 0 0',
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

export default OpenPackageStartEmail;
