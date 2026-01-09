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

    const { data: profile } = await supabase
      .from("profiles")
      .select("email, first_name, last_name")
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

    const logoPath = process.env.NODE_ENV === 'production'
      ? '/la_boutique_d_emorgane_-_logo.png'
      : '/la_boutique_d_emorgane_-_logo.png';

    const imgWidth = pageWidth - (margin * 2);
    const imgHeight = 30;

    try {
      doc.addImage(logoPath, 'PNG', margin, margin, imgWidth, imgHeight);
    } catch (e) {
      console.log("Logo non chargé, continue sans logo");
    }

    let yPosition = margin + imgHeight + 15;

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
      order.shipping_address?.address_line1 || '',
      order.shipping_address?.address_line2 || '',
      `${order.shipping_address?.postal_code || ''} ${order.shipping_address?.city || ''}`,
      order.shipping_address?.country || 'France',
      '',
      profile?.email || '',
      order.shipping_address?.phone || ''
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

    const tableData = (order.items || []).map((item: any) => [
      item.product_name || 'Produit',
      `${item.quantity || 1}`,
      `${(item.price || 0).toFixed(2)} €`,
      `${((item.quantity || 1) * (item.price || 0)).toFixed(2)} €`,
    ]);

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

    const totals = [
      ["Sous-total :", `${(order.subtotal || 0).toFixed(2)} €`],
      ["Frais de port :", `${(order.shipping_cost || 0).toFixed(2)} €`],
    ];

    if (order.discount_amount && order.discount_amount > 0) {
      totals.push(["Remise :", `- ${(order.discount_amount || 0).toFixed(2)} €`]);
    }

    if (order.wallet_amount_used && order.wallet_amount_used > 0) {
      totals.push(["Cagnotte utilisée :", `- ${(order.wallet_amount_used || 0).toFixed(2)} €`]);
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
    doc.text(`${(order.total || 0).toFixed(2)} €`, valueX, yPosition, { align: "right" });

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
