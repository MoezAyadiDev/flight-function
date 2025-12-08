import { db } from "../database/db";
import { Tables, TablesInsert, TablesUpdate } from "../database/supabase";

const tableName = "Flight";
export type Flight = Tables<"Flight">;
export type FlightInsert = TablesInsert<"Flight">;
export type FlightUpdate = TablesUpdate<"Flight">;

//Insert Flight
export async function insertFlight(input: FlightInsert): Promise<Flight> {
  const { data, error } = await db
    .from(tableName)
    .insert(input)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

//Find Flight by flightNum, flight_icao or local_name
export async function findFlightByIdentifier(
  numFlight: string
): Promise<Flight | null> {
  const { data, error } = await db
    .from(tableName)
    .select("*")
    .or(
      `flight_num.eq.${numFlight},flight_icao.eq.${numFlight},local_name.eq.${numFlight}`
    )
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}
