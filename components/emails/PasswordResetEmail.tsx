import { Heading, Text, Button, Section } from '@react-email/components';
import * as React from 'react';
import { EmailLayout } from './EmailLayout';

interface PasswordResetEmailProps {
  resetLink: string;
}

export const PasswordResetEmail = ({ resetLink }: PasswordResetEmailProps) => {
  return (
    <EmailLayout preview={`Chut... Voici ton code secret 🤫`}>
      <Heading style={h1}>Chut... Voici ton code secret 🤫</Heading>

      <Text style={paragraph}>
        Coucou !
      </Text>

      <Text style={paragraph}>
        Tu as demandé à réinitialiser ton mot de passe.
      </Text>

      <Text style={paragraph}>
        Pas de panique, ça arrive même aux meilleures !
      </Text>

      <Section style={resetBox}>
        <Text style={resetText}>
          Clique sur le bouton ci-dessous pour choisir ton nouveau code secret :
        </Text>
        <Button href={resetLink} style={button}>
          🔐 Réinitialiser mon mot de passe
        </Button>
        <Text style={expiryText}>
          ⏱️ Ce lien est valable pendant 1 heure
        </Text>
      </Section>

      <Section style={warningBox}>
        <Text style={warningText}>
          ⚠️ Si ce n'est pas toi, ignore ce mail (mais change tes codes quand même, on ne sait jamais).
        </Text>
      </Section>

      <Text style={signature}>
        Bisous,<br />
        <strong>La Team Morgane</strong> ✨
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

const resetBox = {
  backgroundColor: '#E8F4FD',
  border: '2px solid #4A90E2',
  borderRadius: '8px',
  padding: '30px',
  margin: '30px 0',
  textAlign: 'center' as const,
};

const resetText = {
  fontSize: '16px',
  color: '#333',
  lineHeight: '1.6',
  margin: '0 0 20px 0',
};

const button = {
  backgroundColor: '#4A90E2',
  borderRadius: '5px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 30px',
  margin: '10px 0',
};

const expiryText = {
  fontSize: '14px',
  color: '#666',
  fontStyle: 'italic',
  margin: '15px 0 0 0',
};

const warningBox = {
  backgroundColor: '#FFF3E0',
  borderRadius: '8px',
  padding: '15px',
  margin: '20px 0',
};

const warningText = {
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

export default PasswordResetEmail;
