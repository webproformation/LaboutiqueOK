import { Heading, Text, Button, Section } from '@react-email/components';
import * as React from 'react';
import { EmailLayout } from './EmailLayout';

interface OpenPackageAddEmailProps {
  firstName: string;
  orderNumber: string;
  closingDate: string;
}

export const OpenPackageAddEmail = ({
  firstName,
  orderNumber,
  closingDate
}: OpenPackageAddEmailProps) => {
  return (
    <EmailLayout preview={`Hop ! C'est ajouté dans ton carton 📦`}>
      <Heading style={h1}>Hop ! C'est ajouté 📦</Heading>

      <Text style={paragraph}>
        Coucou {firstName},
      </Text>

      <Text style={paragraph}>
        Bien vu ! On a bien ajouté ta nouvelle commande <strong>#{orderNumber}</strong> à ton colis en cours.
      </Text>

      <Text style={paragraph}>
        Doudou a tout regroupé dans le même casier.
      </Text>

      <Section style={reminderBox}>
        <Text style={reminderTitle}>📅 Rappel</Text>
        <Text style={reminderText}>
          Ton colis sera clôturé et expédié le<br />
          <strong style={{ fontSize: '20px', color: '#D4AF37' }}>{closingDate}</strong>
        </Text>
        <Text style={reminderSubtext}>
          D'ici là, tu peux encore craquer si le cœur t'en dit !
        </Text>
      </Section>

      <Button href={process.env.NEXT_PUBLIC_SITE_URL || 'https://laboutiqudemorgane.fr'} style={button}>
        Voir les nouveautés
      </Button>

      <Text style={signature}>
        Bisous,<br />
        <strong>L'équipe Logistique (Morgane & Doudou)</strong> ✨
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

const reminderBox = {
  backgroundColor: '#FFF9E6',
  border: '2px solid #D4AF37',
  borderRadius: '8px',
  padding: '25px',
  margin: '25px 0',
  textAlign: 'center' as const,
};

const reminderTitle = {
  fontSize: '20px',
  fontWeight: 'bold',
  color: '#D4AF37',
  margin: '0 0 15px 0',
};

const reminderText = {
  fontSize: '16px',
  color: '#333',
  lineHeight: '1.6',
  margin: '15px 0',
};

const reminderSubtext = {
  fontSize: '14px',
  color: '#666',
  fontStyle: 'italic',
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

const signature = {
  color: '#666',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '30px 0 0 0',
  fontStyle: 'italic',
};

export default OpenPackageAddEmail;
