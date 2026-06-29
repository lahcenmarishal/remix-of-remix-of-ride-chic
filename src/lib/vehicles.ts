import { supabase } from "@/integrations/supabase/client";

export type Vehicle = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  capacity_passengers: number;
  capacity_luggage: number;
  base_rate: number;
  per_km_rate: number;
  hourly_rate: number;
  sort_order: number;
};

export async function listVehicles(): Promise<Vehicle[]> {
  const { data, error } = await supabase
    .from("vehicles")
    .select(
      "id,name,category,description,capacity_passengers,capacity_luggage,base_rate,per_km_rate,hourly_rate,sort_order",
    )
    .eq("active", true)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Vehicle[];
}
