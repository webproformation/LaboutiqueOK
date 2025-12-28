import { NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(request: Request) {
  try {
    const { orderId, orderData, autoSend } = await request.json();

    if (!orderId || !orderData) {
      return NextResponse.json(
        { error: 'Order ID and data are required' },
        { status: 400 }
      );
    }

    // Generate invoice
    const generateResponse = await fetch(
      `${SUPABASE_URL}/functions/v1/generate-order-invoice`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId, orderData }),
      }
    );

    if (!generateResponse.ok) {
      const errorText = await generateResponse.text();
      console.error('Generate invoice error:', errorText);
      return NextResponse.json(
        { error: 'Failed to generate invoice' },
        { status: generateResponse.status }
      );
    }

    const invoiceResult = await generateResponse.json();

    // Auto-send email if requested
    if (autoSend && invoiceResult.invoice?.id) {
      try {
        const sendResponse = await fetch(
          `${SUPABASE_URL}/functions/v1/send-order-invoice-email`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ invoiceId: invoiceResult.invoice.id }),
          }
        );

        if (sendResponse.ok) {
          const sendResult = await sendResponse.json();
          return NextResponse.json({
            ...invoiceResult,
            emailSent: true,
            sendResult,
          });
        }
      } catch (sendError) {
        console.error('Auto-send email error:', sendError);
        // Don't fail the request if email sending fails
      }
    }

    return NextResponse.json(invoiceResult);
  } catch (error: any) {
    console.error('API route error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
