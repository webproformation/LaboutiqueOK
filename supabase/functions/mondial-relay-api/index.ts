import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createHash } from "node:crypto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Mondial Relay API credentials
const MR_SOAP_API_URL = "https://api.mondialrelay.com/Web_Services.asmx";
const MR_BRAND_ID = "CC20T067";
const MR_API_KEY = "NktkiSfFBsESB69-O5CpIekU0a0=";

interface PickupPointSearchParams {
  country: string;
  postcode?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  deliveryMode?: string;
  weight?: number;
  actionType?: string;
}

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
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const pathname = url.pathname;

    // Extract the path after /mondial-relay-api
    const parts = pathname.split("/mondial-relay-api");
    const path = parts.length > 1 ? parts[1] : pathname;

    console.log("=== Mondial Relay API Request ===");
    console.log("Full URL:", req.url);
    console.log("Pathname:", pathname);
    console.log("Extracted path:", path);
    console.log("Method:", req.method);
    console.log("Query params:", Object.fromEntries(url.searchParams.entries()));

    // Search pickup points - handle both with and without trailing parts
    if ((path === "/pickup-points" || path.startsWith("/pickup-points")) && req.method === "GET") {
      const country = url.searchParams.get("country") || "FR";
      const postcode = url.searchParams.get("postcode") || "";
      const city = url.searchParams.get("city") || "";
      const numResults = url.searchParams.get("numResults") || "10";
      const deliveryMode = url.searchParams.get("deliveryMode") || "24R";

      console.log("Search params:", { country, postcode, city, numResults, deliveryMode });

      if (!postcode && !city) {
        return new Response(
          JSON.stringify({
            error: "Either postcode or city must be provided",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Build the security hash parameter string
      const securityParams = `${MR_BRAND_ID}${country}${postcode}${city}${deliveryMode}${numResults}`;
      const securityHash = generateSecurityHash(securityParams);

      console.log("Security hash generated for params:", securityParams);

      // Build SOAP request for WSI4_PointRelais_Recherche
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

      console.log("Calling Mondial Relay SOAP API");

      // Call Mondial Relay SOAP API
      const response = await fetch(MR_SOAP_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "text/xml; charset=utf-8",
          "SOAPAction": "http://www.mondialrelay.fr/webservice/WSI4_PointRelais_Recherche",
        },
        body: soapEnvelope,
      });

      console.log("Mondial Relay API response status:", response.status);

      const responseText = await response.text();
      console.log("Response text:", responseText.substring(0, 500));

      if (!response.ok) {
        console.error("Mondial Relay API error:", responseText);
        return new Response(
          JSON.stringify({
            error: "Failed to fetch pickup points",
            details: responseText,
          }),
          {
            status: response.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Parse SOAP XML response
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

      console.log("Mondial Relay API success, found", pickupPoints.length, "points");

      return new Response(JSON.stringify({ PickupPoints: pickupPoints }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create shipment label - TODO: Implement SOAP API for shipment creation
    if ((path === "/create-shipment" || path.startsWith("/create-shipment")) && req.method === "POST") {
      return new Response(
        JSON.stringify({
          error: "Shipment creation not yet implemented",
          message: "This endpoint is under development",
        }),
        {
          status: 501,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Health check endpoint
    if (path === "/health" || path === "/" || path === "") {
      return new Response(
        JSON.stringify({
          status: "ok",
          message: "Mondial Relay SOAP API proxy is running",
          apiVersion: "v1 (SOAP)",
          availableEndpoints: ["/pickup-points", "/create-shipment (not implemented)"]
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("No matching endpoint found for path:", path);

    return new Response(
      JSON.stringify({
        error: "Endpoint not found",
        path,
        method: req.method,
        availableEndpoints: ["/pickup-points", "/create-shipment", "/health"]
      }),
      {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in mondial-relay-api:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});