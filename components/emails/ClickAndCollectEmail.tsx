import { Heading, Text, Section } from '@react-email/components';
import * as React from 'react';
import { EmailLayout } from './EmailLayout';

interface ClickAndCollectEmailProps {
  firstName: string;
}

export const ClickAndCollectEmail = ({ firstName }: ClickAndCollectEmailProps) => {
  return (
    <EmailLayout preview={`Voisine, ta commande t'attend ! 🛍️`}>
      <Heading style={h1}>Voisine, ta commande t'attend ! 🛍️</Heading>

      <Text style={paragraph}>
        Coucou {firstName},
      </Text>

      <Text style={paragraph}>
        <strong>Bonne nouvelle</strong> : Ta commande est prête !
      </Text>

      <Text style={paragraph}>
        Tu peux passer la récupérer à l'atelier quand tu veux (enfin, pendant les horaires d'ouverture hein ! 😉).
      </Text>

      <Section style={infoBox}>
        <Text style={infoTitle}>📍 C'est où ?</Text>
        <Text style={infoText}>
          <strong>1062 Rue d'Armentières</strong><br />
          59850 Nieppe
        </Text>
      </Section>

      <Section style={infoBox}>
        <Text style={infoTitle}>🕒 Quand venir ?</Text>
        <Text style={infoText}>
          Le Mercredi sur RDV de 9h à 19h
        </Text>
        <Text style={contactText}>
          Doudou : <a href="tel:+33603489662" style={link}>06 03 48 96 62</a><br />
          Morgane : <a href="tel:+33641456671" style={link}>06 41 45 66 71</a>
        </Text>
      </Section>

      <Section style={reminderBox}>
        <Text style={reminderText}>
          ⚠️ N'oublie pas ta pièce d'identité<br />
          (et ton plus beau sourire 😊)
        </Text>
      </Section>

      <Text style={signature}>
        À tout de suite !<br />
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

const infoBox = {
  backgroundColor: '#f9f9f9',
  border: '1px solid #e0e0e0',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 0',
  textAlign: 'center' as const,
};

const infoTitle = {
  fontSize: '20px',
  fontWeight: 'bold',
  color: '#D4AF37',
  margin: '0 0 15px 0',
};

const infoText = {
  fontSize: '16px',
  color: '#333',
  lineHeight: '1.8',
  margin: '10px 0',
};

const contactText = {
  fontSize: '15px',
  color: '#666',
  lineHeight: '1.8',
  margin: '15px 0 0 0',
};

const link = {
  color: '#D4AF37',
  textDecoration: 'none',
};

const reminderBox = {
  backgroundColor: '#FFF9E6',
  border: '2px solid #D4AF37',
  borderRadius: '8px',
  padding: '20px',
  margin: '25px 0',
  textAlign: 'center' as const,
};

const reminderText = {
  fontSize: '16px',
  color: '#333',
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

export default ClickAndCollectEmail;
