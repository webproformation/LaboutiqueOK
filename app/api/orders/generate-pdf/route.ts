import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: "Order ID requis" }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .maybeSingle();

    if (orderError || !order) {
      return NextResponse.json({ error: "Commande non trouvée" }, { status: 404 });
    }

    const { data: orderItems } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", orderId);

    const { data: profile } = await supabase
      .from("profiles")
      .select("email, first_name, last_name, phone")
      .eq("id", order.user_id)
      .maybeSingle();

    const { data: shippingMethod } = await supabase
      .from("shipping_methods")
      .select("name")
      .eq("id", order.shipping_method_id)
      .maybeSingle();

    const { data: paymentMethod } = await supabase
      .from("payment_methods")
      .select("name")
      .eq("id", order.payment_method_id)
      .maybeSingle();

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://laboutiquedemorgane.com';
    const logoUrl = `${siteUrl}/lbdm-logobdc.png`;

    let imgHeight = 30;
    const fullWidthImgWidth = pageWidth;

    try {
      const response = await fetch(logoUrl);
      const arrayBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      const imageDataUrl = `data:image/png;base64,${base64}`;

      const img = new Image();
      img.src = imageDataUrl;

      await new Promise((resolve) => {
        img.onload = () => {
          const aspectRatio = img.height / img.width;
          imgHeight = fullWidthImgWidth * aspectRatio;
          resolve(null);
        };
        img.onerror = () => resolve(null);
      });

      doc.addImage(imageDataUrl, 'PNG', 0, 0, fullWidthImgWidth, imgHeight, undefined, 'FAST');
    } catch (e) {
      console.log("Logo non chargé, continue sans logo:", e);
    }

    let yPosition = imgHeight + 15;

    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(212, 175, 55);
    doc.text("BON DE COMMANDE", pageWidth / 2, yPosition, { align: "center" });

    yPosition += 12;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(`Commande N° ${order.order_number}`, pageWidth / 2, yPosition, { align: "center" });
    yPosition += 5;
    doc.text(
      `Date: ${new Date(order.created_at).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })}`,
      pageWidth / 2,
      yPosition,
      { align: "center" }
    );

    yPosition += 15;

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);

    const leftCol = margin;
    const rightCol = pageWidth / 2 + 5;

    doc.text("Informations Vendeur", leftCol, yPosition);
    doc.text("Adresse de Livraison", rightCol, yPosition);
    yPosition += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);

    const sellerInfo = [
      "MORGANE DEWANIN",
      "SAS (Société par Actions Simplifiée)",
      "1062 rue d'Armentières",
      "59850 Nieppe, France",
      "",
      "Tél : +33 6 41 45 66 71",
      "Email : contact@laboutiquedemorgane.com",
      "",
      "SIREN : 907 889 802",
      "SIRET : 907 889 802 00027",
      "TVA : FR16907889802",
      "APE : 4641Z"
    ];

    const clientInfo = [
      `${order.shipping_address?.first_name || ''} ${order.shipping_address?.last_name || ''}`,
      order.shipping_street || order.shipping_address?.address_line1 || '',
      order.shipping_address?.address_line2 || '',
      `${order.shipping_address?.postal_code || ''} ${order.shipping_address?.city || ''}`,
      order.shipping_address?.country || 'France',
      '',
      `Tél: ${order.shipping_phone || order.shipping_address?.phone || profile?.phone || ''}`,
      profile?.email || ''
    ];

    let tempY = yPosition;
    sellerInfo.forEach((line) => {
      doc.text(line, leftCol, tempY);
      tempY += 4;
    });

    tempY = yPosition;
    clientInfo.forEach((line) => {
      if (line) {
        doc.text(line, rightCol, tempY);
        tempY += 4;
      }
    });

    yPosition = Math.max(yPosition + (sellerInfo.length * 4), tempY) + 10;

    const tableData = (orderItems || []).map((item: any) => {
      let productName = item.product_name || 'Produit';

      if (item.variation_data && typeof item.variation_data === 'object') {
        const attributes = Object.entries(item.variation_data)
          .filter(([key]) => key !== 'id' && key !== 'variation_id')
          .map(([key, value]) => {
            const displayValue = typeof value === 'object' && value !== null
              ? (value as any)?.name || (value as any)?.option || String(value)
              : String(value);
            return `${key}: ${displayValue}`;
          })
          .join(', ');
        if (attributes) {
          productName += `\n(${attributes})`;
        }
      }

      const price = Number(item.price) || 0;
      const quantity = item.quantity || 1;

      return [
        productName,
        `${quantity}`,
        `${price.toFixed(2)} €`,
        `${(quantity * price).toFixed(2)} €`,
      ];
    });

    autoTable(doc, {
      startY: yPosition,
      head: [["Produit", "Qté", "Prix Unit.", "Total"]],
      body: tableData,
      theme: "striped",
      headStyles: {
        fillColor: [212, 175, 55],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 10,
      },
      bodyStyles: {
        fontSize: 9,
      },
      columnStyles: {
        0: { cellWidth: "auto" },
        1: { cellWidth: 20, halign: "center" },
        2: { cellWidth: 30, halign: "right" },
        3: { cellWidth: 30, halign: "right" },
      },
      margin: { left: margin, right: margin },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;

    const rightAlign = pageWidth - margin;
    const labelX = rightAlign - 60;
    const valueX = rightAlign;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");

    const subtotal = Number(order.subtotal) || 0;
    const shippingCost = Number(order.shipping_cost) || 0;
    const discountAmount = Number(order.discount_amount) || 0;
    const walletUsed = Number(order.wallet_amount_used) || 0;

    const totals = [
      ["Sous-total :", `${subtotal.toFixed(2)} €`],
      ["Frais de port :", `${shippingCost.toFixed(2)} €`],
    ];

    if (discountAmount > 0) {
      totals.push(["Remise :", `- ${discountAmount.toFixed(2)} €`]);
    }

    if (walletUsed > 0) {
      totals.push(["Cagnotte utilisée :", `- ${walletUsed.toFixed(2)} €`]);
    }

    if (order.coupon_code) {
      totals.push(["Code coupon :", order.coupon_code]);
    }

    if (order.referral_code) {
      totals.push(["Code de parrainage :", order.referral_code]);
    }

    totals.forEach(([label, value]) => {
      doc.text(label, labelX, yPosition, { align: "right" });
      doc.text(value, valueX, yPosition, { align: "right" });
      yPosition += 5;
    });

    yPosition += 2;
    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(0.5);
    doc.line(labelX - 5, yPosition, valueX, yPosition);
    yPosition += 5;

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL TTC :", labelX, yPosition, { align: "right" });
    const totalAmount = Number(order.total_amount || order.total) || 0;
    doc.text(`${totalAmount.toFixed(2)} €`, valueX, yPosition, { align: "right" });

    yPosition += 10;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);

    if (shippingMethod) {
      doc.text(`Mode de livraison : ${shippingMethod.name}`, margin, yPosition);
      yPosition += 5;
    }

    if (paymentMethod) {
      doc.text(`Mode de paiement : ${paymentMethod.name}`, margin, yPosition);
      yPosition += 5;
    }

    yPosition += 5;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    const legalText = [
      "Conformément à la loi n°78-17 du 6 janvier 1978, vous disposez d'un droit d'accès, de modification, de rectification et de suppression des données vous concernant.",
      "En cas de litige, seuls les tribunaux français seront compétents. Garantie légale de conformité et des vices cachés applicable.",
    ];

    legalText.forEach((line) => {
      const splitText = doc.splitTextToSize(line, pageWidth - (margin * 2));
      doc.text(splitText, margin, yPosition);
      yPosition += splitText.length * 3.5;
    });

    yPosition += 5;
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(
      "MORGANE DEWANIN - SAS au capital variable - SIREN 907 889 802 - TVA FR16907889802",
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );

    const pdfBuffer = doc.output("arraybuffer");
    const pdfBase64 = Buffer.from(pdfBuffer).toString("base64");

    return NextResponse.json({
      success: true,
      pdf: pdfBase64,
      filename: `Commande_${order.order_number}.pdf`,
    });
  } catch (error: any) {
    console.error("Erreur génération PDF:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération du PDF", details: error.message },
      { status: 500 }
    );
  }
}
