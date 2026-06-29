// Edge function: compute driving route via Lovable Google Maps connector gateway.
// Keeps LOVABLE_API_KEY + GOOGLE_MAPS_API_KEY server-side.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { origin, destination } = await req.json();
    if (
      !origin || !destination ||
      typeof origin.lat !== "number" || typeof origin.lng !== "number" ||
      typeof destination.lat !== "number" || typeof destination.lng !== "number"
    ) {
      return new Response(JSON.stringify({ error: "Invalid origin/destination" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    const connKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
    if (!apiKey || !connKey) {
      return new Response(JSON.stringify({ error: "Google Maps connector not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const res = await fetch(
      "https://connector-gateway.lovable.dev/google_maps/routes/directions/v2:computeRoutes",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "X-Connection-Api-Key": connKey,
          "Content-Type": "application/json",
          "X-Goog-FieldMask":
            "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline",
        },
        body: JSON.stringify({
          origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
          destination: { location: { latLng: { latitude: destination.lat, longitude: destination.lng } } },
          travelMode: "DRIVE",
          routingPreference: "TRAFFIC_AWARE",
        }),
      },
    );
    if (!res.ok) {
      const t = await res.text();
      return new Response(JSON.stringify({ error: `Routes API failed: ${res.status} ${t.slice(0, 200)}` }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const json = await res.json();
    const r = json.routes?.[0];
    if (!r) {
      return new Response(JSON.stringify({ error: "No route found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const durationSeconds = r.duration ? parseInt(String(r.duration).replace("s", ""), 10) : 0;
    return new Response(
      JSON.stringify({
        distanceMeters: r.distanceMeters ?? 0,
        durationSeconds,
        polyline: r.polyline?.encodedPolyline ?? "",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
