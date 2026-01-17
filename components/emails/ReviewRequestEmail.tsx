import { Heading, Text, Button, Section } from '@react-email/components';
import * as React from 'react';
import { EmailLayout } from './EmailLayout';

interface ReviewRequestEmailProps {
  firstName: string;
}

export const ReviewRequestEmail = ({ firstName }: ReviewRequestEmailProps) => {
  return (
    <EmailLayout preview={`Alors, le verdict ? (Et une surprise inside...) ⭐`}>
      <Heading style={h1}>Alors, le verdict ? ⭐</Heading>

      <Text style={paragraph}>
        Coucou {firstName},
      </Text>

      <Text style={paragraph}>
        On espère que tu as bien reçu ton colis et que tes nouvelles pépites te vont à ravir !
      </Text>

      <Text style={paragraph}>
        On a hâte de savoir ce que tu en penses.
      </Text>

      <Section style={rewardBox}>
        <Text style={rewardIcon}>💰</Text>
        <Text style={rewardTitle}>Donne ton avis et gagne du Cash !</Text>
        <Text style={rewardText}>
          Dis-nous tout (la taille, la matière, ton ressenti...)<br />
          <strong>Chaque avis = +0,20 € crédités directement dans ta cagnotte fidélité !</strong>
        </Text>
      </Section>

      <Section style={starBox}>
        <Text style={starIcon}>🌟</Text>
        <Text style={starTitle}>Veux-tu être notre Star ?</Text>
        <Text style={starText}>
          Poste une jolie photo de toi avec ta tenue en commentaire : tu participeras automatiquement au
          <strong> concours de l'Ambassadrice de la Semaine</strong>.
        </Text>
        <Text style={prizeText}>
          À la clé : <strong>5€ CASH</strong> et ta photo en une du site ! 📸
        </Text>
      </Section>

      <Button href={`${process.env.NEXT_PUBLIC_SITE_URL}/account/orders`} style={button}>
        📝 Je donne mon avis et je tente ma chance
      </Button>

      <Text style={signature}>
        Merci d'être là,<br />
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

const rewardBox = {
  backgroundColor: '#E8F5E9',
  border: '2px solid #4CAF50',
  borderRadius: '8px',
  padding: '25px',
  margin: '25px 0',
  textAlign: 'center' as const,
};

const rewardIcon = {
  fontSize: '48px',
  margin: '0 0 10px 0',
};

const rewardTitle = {
  fontSize: '20px',
  fontWeight: 'bold',
  color: '#4CAF50',
  margin: '10px 0',
};

const rewardText = {
  fontSize: '16px',
  color: '#333',
  lineHeight: '1.6',
  margin: '15px 0',
};

const starBox = {
  backgroundColor: '#FFF9E6',
  border: '2px solid #D4AF37',
  borderRadius: '8px',
  padding: '25px',
  margin: '25px 0',
  textAlign: 'center' as const,
};

const starIcon = {
  fontSize: '48px',
  margin: '0 0 10px 0',
};

const starTitle = {
  fontSize: '20px',
  fontWeight: 'bold',
  color: '#D4AF37',
  margin: '10px 0',
};

const starText = {
  fontSize: '16px',
  color: '#333',
  lineHeight: '1.6',
  margin: '15px 0',
};

const prizeText = {
  fontSize: '18px',
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

const signature = {
  color: '#666',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '30px 0 0 0',
  fontStyle: 'italic',
};

export default ReviewRequestEmail;
