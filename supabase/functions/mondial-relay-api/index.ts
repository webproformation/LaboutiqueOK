import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createHash } from "node:crypto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const MR_SOAP_API_URL = "https://api.mondialrelay.com/Web_Services.asmx";
const MR_BRAND_ID = "CC20T067";
const MR_API_KEY = "NktkiSfFBsESB69-O5CpIekU0a0=";

function generateSecurityHash(params: string): string {
  const hashInput = params + MR_API_KEY;
  const hash = createHash('md5');
  hash.update(hashInput);
  return hash.digest('hex').toUpperCase();
}

function buildSOAPEnvelope(body: string): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <soap:Body>
    ${body}
  </soap:Body>
</soap:Envelope>`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathname = url.pathname;
    const parts = pathname.split("/mondial-relay-api");
    const path = parts.length > 1 ? parts[1] : pathname;

    if ((path === "/pickup-points" || path.startsWith("/pickup-points")) && req.method === "GET") {
      const country = url.searchParams.get("country") || "FR";
      const postcode = url.searchParams.get("postcode") || "";
      const city = url.searchParams.get("city") || "";
      const numResults = url.searchParams.get("numResults") || "10";
      const deliveryMode = url.searchParams.get("deliveryMode") || "24R";

      if (!postcode && !city) {
        return new Response(
          JSON.stringify({ error: "Either postcode or city must be provided" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const securityParams = `${MR_BRAND_ID}${country}${postcode}${city}${deliveryMode}${numResults}`;
      const securityHash = generateSecurityHash(securityParams);

      const soapBody = `<WSI4_PointRelais_Recherche xmlns="http://www.mondialrelay.fr/webservice/">
      <Enseigne>${MR_BRAND_ID}</Enseigne>
      <Pays>${country}</Pays>
      <CP>${postcode}</CP>
      <Ville>${city}</Ville>
      <Action>${deliveryMode}</Action>
      <NbResultats>${numResults}</NbResultats>
      <Security>${securityHash}</Security>
    </WSI4_PointRelais_Recherche>`;

      const soapEnvelope = buildSOAPEnvelope(soapBody);

      const response = await fetch(MR_SOAP_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "text/xml; charset=utf-8",
          "SOAPAction": "http://www.mondialrelay.fr/webservice/WSI4_PointRelais_Recherche",
        },
        body: soapEnvelope,
      });

      const responseText = await response.text();

      if (!response.ok) {
        return new Response(
          JSON.stringify({ error: "Failed to fetch pickup points", details: responseText }),
          { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const pickupPoints: any[] = [];
      const pointRelaisMatches = responseText.matchAll(/<PointRelais_Details>([\s\S]*?)<\/PointRelais_Details>/g);

      for (const match of pointRelaisMatches) {
        const pointXml = match[1];
        const extractValue = (tag: string): string => {
          const regex = new RegExp(`<${tag}>(.*?)<\/${tag}>`);
          const match = pointXml.match(regex);
          return match ? match[1] : "";
        };

        pickupPoints.push({
          Id: extractValue("Num"),
          Name: extractValue("LgAdr1"),
          Address1: extractValue("LgAdr3"),
          Address2: extractValue("LgAdr4"),
          PostCode: extractValue("CP"),
          City: extractValue("Ville"),
          Country: extractValue("Pays"),
          Latitude: extractValue("Latitude"),
          Longitude: extractValue("Longitude"),
          Distance: extractValue("Distance"),
          OpeningHours: {
            Monday: extractValue("Horaires_Lundi"),
            Tuesday: extractValue("Horaires_Mardi"),
            Wednesday: extractValue("Horaires_Mercredi"),
            Thursday: extractValue("Horaires_Jeudi"),
            Friday: extractValue("Horaires_Vendredi"),
            Saturday: extractValue("Horaires_Samedi"),
            Sunday: extractValue("Horaires_Dimanche"),
          },
        });
      }

      return new Response(JSON.stringify({ PickupPoints: pickupPoints }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (path === "/health" || path === "/" || path === "") {
      return new Response(
        JSON.stringify({
          status: "ok",
          message: "Mondial Relay SOAP API proxy is running",
          apiVersion: "v1 (SOAP)",
          availableEndpoints: ["/pickup-points"]
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Endpoint not found", path, method: req.method }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
