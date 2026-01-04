import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const ONESIGNAL_API_KEY = Deno.env.get("ONESIGNAL_API_KEY")!;
const ONESIGNAL_APP_ID = Deno.env.get("ONESIGNAL_APP_ID")!;

interface NotificationRequest {
  title: string;
  message: string;
  url?: string;
  imageUrl?: string;
  notificationType: 'live' | 'new_products' | 'hidden_diamond' | 'custom';
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { title, message, url, imageUrl, notificationType }: NotificationRequest = await req.json();

    if (!title || !message) {
      return new Response(
        JSON.stringify({ error: "Title and message are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const notificationData: any = {
      app_id: ONESIGNAL_APP_ID,
      headings: { en: title },
      contents: { en: message },
      included_segments: ["Subscribed Users"],
    };

    if (url) {
      notificationData.url = url;
    }

    if (imageUrl) {
      notificationData.big_picture = imageUrl;
      notificationData.large_icon = imageUrl;
    }

    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${ONESIGNAL_API_KEY}`,
      },
      body: JSON.stringify(notificationData),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.errors?.join(", ") || "Failed to send notification");
    }

    return new Response(
      JSON.stringify({
        success: true,
        onesignalId: result.id,
        recipients: result.recipients,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error sending notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});