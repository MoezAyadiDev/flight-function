import { Tables, TablesInsert, TablesUpdate } from "../database/supabase";
import { db } from "../database/db";

const tableName = "Airline";
export type Airline = Tables<"Airline">;
export type AirlineInsert = TablesInsert<"Airline">;
export type AirlineUpdate = TablesUpdate<"Airline">;

//Get the number of Airline in database
export async function countAirlines(): Promise<number> {
  const { count, error } = await db
    .from(tableName)
    .select("*", { count: "exact" });
  return count ?? 0;
}

//Insert list of airlines
export async function insertAirlines(input: AirlineInsert[]): Promise<boolean> {
  const responseInsert = await db.from(tableName).insert(input);
  return responseInsert.status === 201 ? true : false;
}
