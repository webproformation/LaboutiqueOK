import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Fonction utilitaire pour charger l'image du dossier public
const loadImage = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Important pour éviter les problèmes de sécurité navigateur
    img.crossOrigin = 'Anonymous'; 
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = (e) => reject(e);
    img.src = url;
  });
};

// La fonction devient ASYNC (async)
export const generateInvoicePDF = async (order: any, invoiceNumber: string) => {
  const doc = new jsPDF();
  const orderDate = new Date(order.created_at);
  
  // --- CHARGEMENT DU LOGO ---
  try {
    // Le chemin commence par / pour pointer vers le dossier 'public'
    const logoUrl = '/lbdm-logobdc.png';
    const logoData = await loadImage(logoUrl);
    
    // Ajout de l'image (données, format, X, Y, Largeur, Hauteur)
    // Ajustez Largeur (70) et Hauteur (25) si les proportions ne sont pas parfaites
    doc.addImage(logoData, 'PNG', 14, 10, 70, 25);

  } catch (error) {
    console.error("Erreur chargement logo:", error);
    // Fallback texte si l'image ne charge pas (sécurité)
    doc.setFontSize(18).setTextColor("#D4AF37").text("BOUTIQUE De Morgane", 14, 25);
  }

  // --- SOUS-TITRE (Sous le logo) ---
  const ySubtitle = 40;
  doc.setFontSize(10);
  doc.setTextColor("#333333");
  doc.setFont("helvetica", "normal");
  doc.text("SHOPPING EN LIVE DEPUIS 2020", 14, ySubtitle);
  doc.text("Votre dose de style et de joie", 14, ySubtitle + 5);

  // --- VENDEUR (Gauche) ---
  const yVendeur = ySubtitle + 15;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Informations Vendeur", 14, yVendeur);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("MORGANE DEWANIN", 14, yVendeur + 6);
  doc.text("SAS (Société par Actions Simplifiée)", 14, yVendeur + 11);
  doc.text("1062 rue d'Armentières", 14, yVendeur + 16);
  doc.text("59850 Nieppe, France", 14, yVendeur + 21);
  doc.text("Email: contact@laboutiquedemorgane.com", 14, yVendeur + 26);
  doc.text("SIREN: 907 889 802", 14, yVendeur + 31);
  doc.text("TVA: FR16907889802", 14, yVendeur + 36);

  // --- FACTURE (Encadré à Droite) ---
  // Alignement vertical avec le haut du logo
  doc.setDrawColor(212, 175, 55); 
  doc.setLineWidth(0.5);
  doc.roundedRect(110, 10, 85, 25, 2, 2);
  
  doc.setFontSize(16);
  doc.setTextColor("#D4AF37");
  doc.setFont("helvetica", "bold");
  doc.text("FACTURE", 152.5, 20, { align: "center" });
  
  doc.setFontSize(10);
  doc.setTextColor("#333333");
  doc.setFont("helvetica", "bold");
  doc.text(`N° ${invoiceNumber}`, 152.5, 27, { align: "center" });
  doc.setFont("helvetica", "normal");
  // Date du jour pour la facture
  doc.text(`Date : ${format(new Date(), 'dd MMMM yyyy', { locale: fr })}`, 152.5, 32, { align: "center" });

  // --- CLIENT (Droite, sous le cadre) ---
  const yClient = 60;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Adresse de Facturation", 110, yClient);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const clientName = `${order.shipping_address?.first_name || ''} ${order.shipping_address?.last_name || ''}`;
  const clientStreet = order.shipping_address?.address_line1 || '';
  const clientCity = `${order.shipping_address?.postal_code || ''} ${order.shipping_address?.city || ''}`;
  const clientCountry = order.shipping_address?.country || 'France';

  doc.text(clientName, 110, yClient + 6);
  doc.text(clientStreet, 110, yClient + 11);
  if (order.shipping_address?.address_line2) {
    doc.text(order.shipping_address.address_line2, 110, yClient + 16);
    doc.text(clientCity, 110, yClient + 21);
    doc.text(clientCountry, 110, yClient + 26);
  } else {
    doc.text(clientCity, 110, yClient + 16);
    doc.text(clientCountry, 110, yClient + 21);
  }

  // --- TABLEAU ---
  const tableRows: any[] = [];
  order.items?.forEach((item: any) => {
    const variation = item.variation_name ? `\n(${item.variation_name})` : '';
    tableRows.push([
      item.product_name + variation,
      item.quantity,
      `${parseFloat(item.price).toFixed(2)} €`,
      `${(item.price * item.quantity).toFixed(2)} €`
    ]);
  });

  // @ts-ignore
  autoTable(doc, {
    startY: 110, // Un peu plus bas pour laisser de la place
    head: [["Produit", "Qté", "Prix Unit.", "Total"]],
    body: tableRows,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 3, textColor: 33 },
    headStyles: { fillColor: [240, 240, 240], textColor: 33, fontStyle: 'bold', lineColor: 200, lineWidth: 0.1 },
    bodyStyles: { lineColor: 200, lineWidth: 0.1 },
    columnStyles: {
      0: { cellWidth: 'auto' }, 
      1: { cellWidth: 20, halign: 'center' }, 
      2: { cellWidth: 30, halign: 'right' }, 
      3: { cellWidth: 30, halign: 'right' } 
    }
  });

  // --- TOTAUX ---
  // @ts-ignore
  let finalY = doc.lastAutoTable.finalY + 10;
  const xLabel = 140;
  const xValue = 195;

  doc.setFontSize(10);
  doc.text("Sous-total :", xLabel, finalY);
  doc.text(`${parseFloat(order.total_amount).toFixed(2)} €`, xValue, finalY, { align: 'right' });
  finalY += 8;

  doc.setLineWidth(0.5);
  doc.line(130, finalY - 4, 195, finalY - 4);
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL TTC :", xLabel, finalY);
  doc.text(`${parseFloat(order.total_amount).toFixed(2)} €`, xValue, finalY, { align: 'right' });

  // --- PIED DE PAGE ---
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(100);
  doc.text("Conditions de paiement : " + (order.payment_method || 'CB / Stripe'), 14, finalY + 20);
  doc.text("MORGANE DEWANIN - SAS au capital variable - SIREN 907 889 802 - TVA FR16907889802", 105, pageHeight - 10, { align: "center" });

  return doc; // Retourne le document une fois tout chargé
};