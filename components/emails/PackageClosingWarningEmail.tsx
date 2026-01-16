import { Heading, Text, Button, Section } from '@react-email/components';
import * as React from 'react';
import { EmailLayout } from './EmailLayout';

interface PackageClosingWarningEmailProps {
  firstName: string;
}

export const PackageClosingWarningEmail = ({ firstName }: PackageClosingWarningEmailProps) => {
  return (
    <EmailLayout preview={`Dernière ligne droite ! Ton colis part demain ⏳`}>
      <Heading style={h1}>Dernière ligne droite ! ⏳</Heading>

      <Text style={paragraph}>
        Coucou {firstName},
      </Text>

      <Text style={paragraph}>
        <strong>Petit flash info !</strong>
      </Text>

      <Section style={urgentBox}>
        <Text style={urgentIcon}>⏰</Text>
        <Text style={urgentTitle}>Ton "Colis Ouvert" se ferme dans 24 heures</Text>
        <Text style={urgentText}>
          C'est le moment ou jamais si tu avais repéré un petit accessoire, un fondant ou un dernier top
          pour compléter ta commande...
        </Text>
        <Text style={urgentSubtext}>
          <strong>C'est ta dernière chance de l'ajouter sans payer de frais de port supplémentaires !</strong>
        </Text>
      </Section>

      <Button href={`${process.env.NEXT_PUBLIC_SITE_URL}/nouveautes`} style={button}>
        👀 Je jette un dernier œil aux nouveautés
      </Button>

      <Section style={infoBox}>
        <Text style={infoText}>
          💡 <strong>Info :</strong> Si tu as fini, ne fais rien : ton colis partira tout seul comme un grand demain matin.
        </Text>
      </Section>

      <Text style={signature}>
        À très vite !<br />
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

const urgentBox = {
  backgroundColor: '#FFE5E5',
  border: '2px solid #FF6B6B',
  borderRadius: '8px',
  padding: '30px',
  margin: '25px 0',
  textAlign: 'center' as const,
};

const urgentIcon = {
  fontSize: '48px',
  margin: '0 0 10px 0',
};

const urgentTitle = {
  fontSize: '22px',
  fontWeight: 'bold',
  color: '#FF6B6B',
  margin: '10px 0 15px 0',
};

const urgentText = {
  fontSize: '16px',
  color: '#333',
  lineHeight: '1.6',
  margin: '15px 0',
};

const urgentSubtext = {
  fontSize: '16px',
  color: '#D4AF37',
  margin: '15px 0 0 0',
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

const infoBox = {
  backgroundColor: '#f9f9f9',
  borderRadius: '8px',
  padding: '15px',
  margin: '20px 0',
};

const infoText = {
  fontSize: '15px',
  color: '#666',
  lineHeight: '1.6',
  margin: '0',
};

const signature = {
  color: '#666',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '30px 0 0 0',
  fontStyle: 'italic',
};

export default PackageClosingWarningEmail;
