import { Heading, Text, Button, Section, Row, Column, Img } from '@react-email/components';
import * as React from 'react';
import { EmailLayout } from './EmailLayout';

interface OrderItem {
  image_url: string | null;
  product_name: string;
  sku?: string;
  variation_details?: any;
  quantity: number;
  price: number;
}

interface OrderConfirmationEmailProps {
  firstName: string;
  orderNumber: string;
  items: OrderItem[];
  total: number;
}

export const OrderConfirmationEmail = ({
  firstName,
  orderNumber,
  items,
  total
}: OrderConfirmationEmailProps) => {
  return (
    <EmailLayout preview={`Merci ${firstName} ! On s'occupe de tout 🎁`}>
      <Heading style={h1}>Merci {firstName} ! 🎁</Heading>

      <Text style={paragraph}>
        Coucou {firstName},
      </Text>

      <Text style={paragraph}>
        Mille mercis pour ta commande <strong>#{orderNumber}</strong> !
      </Text>

      <Text style={paragraph}>
        Tes pépites sont bien réservées. Doudou va s'occuper de préparer ton colis avec tout le soin qu'il mérite
        (et sûrement en chantant, mais ça, on n'y peut rien ! 🎤).
      </Text>

      <Text style={paragraph}>
        Tu recevras un petit mail dès que ça part de Nieppe.
      </Text>

      <Section style={orderBox}>
        <Text style={boxTitle}>Récapitulatif de tes craquages :</Text>

        {items.map((item, index) => (
          <Row key={index} style={itemRow}>
            <Column style={{ width: '80px' }}>
              {item.image_url && (
                <Img src={item.image_url} width="70" height="70" style={itemImage} alt={item.product_name} />
              )}
            </Column>
            <Column style={{ paddingLeft: '10px' }}>
              <Text style={itemName}>{item.product_name}</Text>
              {item.sku && (
                <Text style={itemSKU}>UGS: {item.sku}</Text>
              )}
              {item.variation_details && (
                <Text style={itemDetails}>
                  {Object.entries(item.variation_details).map(([key, value]) =>
                    `${key}: ${value}`
                  ).join(' • ')}
                </Text>
              )}
              <Text style={itemQuantity}>Quantité : {item.quantity}</Text>
            </Column>
            <Column style={{ textAlign: 'right', width: '80px' }}>
              <Text style={itemPrice}>{(item.price * item.quantity).toFixed(2)}€</Text>
            </Column>
          </Row>
        ))}

        <Row style={{ marginTop: '20px', paddingTop: '20px', borderTop: '2px solid #D4AF37' }}>
          <Column>
            <Text style={totalLabel}>Total</Text>
          </Column>
          <Column style={{ textAlign: 'right' }}>
            <Text style={totalPrice}>{total.toFixed(2)}€</Text>
          </Column>
        </Row>
      </Section>

      <Button href={`${process.env.NEXT_PUBLIC_SITE_URL}/account/orders`} style={button}>
        Voir ma commande
      </Button>

      <Text style={signature}>
        Gros bisous,<br />
        <strong>La Boutique de Morgane</strong> ✨
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

const orderBox = {
  backgroundColor: '#f9f9f9',
  border: '1px solid #e0e0e0',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 0',
};

const boxTitle = {
  color: '#D4AF37',
  fontSize: '18px',
  fontWeight: 'bold',
  marginBottom: '20px',
};

const itemRow = {
  marginBottom: '15px',
  paddingBottom: '15px',
  borderBottom: '1px solid #e0e0e0',
};

const itemImage = {
  borderRadius: '4px',
  objectFit: 'cover' as const,
};

const itemName = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#333',
  margin: '0 0 5px 0',
};

const itemSKU = {
  fontSize: '12px',
  color: '#999',
  margin: '0 0 5px 0',
  fontStyle: 'italic' as const,
};

const itemDetails = {
  fontSize: '14px',
  color: '#666',
  margin: '0 0 5px 0',
};

const itemQuantity = {
  fontSize: '14px',
  color: '#666',
  margin: '0',
};

const itemPrice = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#D4AF37',
  margin: '0',
};

const totalLabel = {
  fontSize: '20px',
  fontWeight: 'bold',
  color: '#333',
  margin: '0',
};

const totalPrice = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#D4AF37',
  margin: '0',
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

export default OrderConfirmationEmail;
