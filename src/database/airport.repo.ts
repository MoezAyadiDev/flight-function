import { db } from "./db";
import { Tables, TablesInsert, TablesUpdate } from "./supabase";

const tableName = "Airport";
export type Airport = Tables<"Airport">;
export type AirportInsert = TablesInsert<"Airport">;
export type AirportUpdate = TablesUpdate<"Airport">;

export async function getAirports(): Promise<Airport[]> {
  const { data, error } = await db.from(tableName).select("*");
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

export async function insertAirport(input: AirportInsert): Promise<Airport> {
  const { data, error } = await db
    .from("Airport")
    .insert(input)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function findAirportByIcao(icao: string): Promise<Airport | null> {
  const { data, error } = await db
    .from("Airport")
    .select("*")
    .eq("icao", icao)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function findAirportByIata(iata: string): Promise<Airport | null> {
  const { data, error } = await db
    .from("Airport")
    .select("*")
    .eq("iata", iata)
    .maybeSingle();
  if (error) throw new Error(error.message);

  return data;
}
