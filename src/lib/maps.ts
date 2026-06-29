import { supabase } from "@/integrations/supabase/client";

export type LatLng = { lat: number; lng: number };

export async function computeRoute(input: { origin: LatLng; destination: LatLng }) {
  const { data, error } = await supabase.functions.invoke<{
    distanceMeters: number;
    durationSeconds: number;
    polyline: string;
  }>("compute-route", { body: input });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("No route returned");
  return data;
}
