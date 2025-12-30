import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RequestBody {
  phoneNumber: string;
  firstName: string;
  lastName: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { phoneNumber, firstName, lastName }: RequestBody = await req.json();

    if (!phoneNumber || !firstName || !lastName) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "phoneNumber, firstName et lastName sont requis"
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    if (!brevoApiKey) {
      console.error("BREVO_API_KEY non configurée");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Configuration Brevo manquante"
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    let cleanedPhoneNumber = phoneNumber.replace(/\s+/g, '');

    if (cleanedPhoneNumber.startsWith('0')) {
      cleanedPhoneNumber = '+33' + cleanedPhoneNumber.substring(1);
    } else if (!cleanedPhoneNumber.startsWith('+')) {
      cleanedPhoneNumber = '+33' + cleanedPhoneNumber;
    }

    const message = `Bonjour ${firstName} ${lastName}, Tu viens de te connecter à ton espace LA BOUTIQUE DE MORGANE, c'est super !!! L'envoi d'SMS fonctionne aussi !`;

    const brevoResponse = await fetch("https://api.brevo.com/v3/transactionalSMS/sms", {
      method: "POST",
      headers: {
        "api-key": brevoApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: "LBDM",
        recipient: cleanedPhoneNumber,
        content: message,
        type: "transactional",
      }),
    });

    if (!brevoResponse.ok) {
      const errorData = await brevoResponse.json();
      console.error("Erreur Brevo SMS:", errorData);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Échec de l'envoi du SMS",
          details: errorData
        }),
        {
          status: brevoResponse.status,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const brevoData = await brevoResponse.json();

    return new Response(
      JSON.stringify({
        success: true,
        message: "SMS envoyé avec succès",
        data: brevoData,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Erreur lors de l'envoi du SMS:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});