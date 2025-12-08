import { db } from "../database/db";
import { Tables, TablesInsert, TablesUpdate } from "../database/supabase";

const tableName = "Airport";
export type Airport = Tables<"Airport">;
export type AirportInsert = TablesInsert<"Airport">;
export type AirportUpdate = TablesUpdate<"Airport">;

//Get the number of Airport in database
export async function countAirports(): Promise<number> {
  const { count, error } = await db
    .from(tableName)
    .select("*", { count: "exact" });
  if (error) throw new Error(error.message);
  if (!count) return 0;
  return count;
}

//Get the list of Airports
export async function getAirports(): Promise<Airport[]> {
  const { data, error } = await db.from(tableName).select("*");
  if (error) throw Error(error.message);
  return data;
}

//Insert airport
export async function insertAirport(input: AirportInsert): Promise<Airport> {
  const { data, error } = await db
    .from(tableName)
    .insert(input)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

//Insert list airport
export async function insertAirports(input: AirportInsert[]): Promise<boolean> {
  const responseInsert = await db.from(tableName).insert(input);
  return responseInsert.status === 201 ? true : false;
}

//Find airport by icao
export async function findAirportByIcao(icao: string): Promise<Airport | null> {
  const { data, error } = await db
    .from(tableName)
    .select("*")
    .eq("icao", icao)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

//Find airport by iata
export async function findAirportByIata(iata: string): Promise<Airport | null> {
  const { data, error } = await db
    .from(tableName)
    .select("*")
    .eq("iata", iata)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

//Find airport by Name
export async function findAirportByName(
  airportName: string
): Promise<Airport | null> {
  const { data, error } = await db
    .from(tableName)
    .select("*")
    .like("airport_name", `%${airportName}%`)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}
