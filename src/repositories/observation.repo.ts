import { Tables, TablesInsert, TablesUpdate } from "../database/supabase";
import { db } from "../database/db";

const tableName = "Observation";
export type Observation = Tables<"Observation">;
export type ObservationInsert = TablesInsert<"Observation">;
export type ObservationUpdate = TablesUpdate<"Observation">;

//Find airline by icao
export async function findObservationsByIdTraffic(
  id: number
): Promise<Observation[]> {
  const { data, error } = await db
    .from(tableName)
    .select("*")
    .eq("trafic_id", id);
  if (error) throw new Error(error.message);
  if (!data) return [];
  return data;
}

//Insert Traffics
export async function insertObservations(
  input: ObservationInsert[]
): Promise<Observation[]> {
  const { data, error } = await db.from(tableName).insert(input).select();
  if (error) throw new Error(error.message);
  return data;
}
