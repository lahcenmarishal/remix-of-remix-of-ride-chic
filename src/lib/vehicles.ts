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

export type AdminVehicle = Vehicle & { active: boolean };

export async function listAllVehiclesAdmin(): Promise<AdminVehicle[]> {
  const { data, error } = await supabase
    .from("vehicles")
    .select(
      "id,name,category,description,capacity_passengers,capacity_luggage,base_rate,per_km_rate,hourly_rate,sort_order,active",
    )
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as AdminVehicle[];
}

export type VehicleInput = {
  name: string;
  category: string;
  description?: string | null;
  capacity_passengers: number;
  capacity_luggage: number;
  base_rate: number;
  per_km_rate: number;
  hourly_rate: number;
  sort_order: number;
  active: boolean;
};

export async function createVehicle(input: VehicleInput) {
  const { error } = await supabase.from("vehicles").insert(input);
  if (error) throw new Error(error.message);
}

export async function updateVehicle(id: string, input: Partial<VehicleInput>) {
  const { error } = await supabase.from("vehicles").update(input).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteVehicle(id: string) {
  const { error } = await supabase.from("vehicles").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
