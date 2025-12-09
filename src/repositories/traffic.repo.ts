import { db } from "../database/db";
import { Tables, TablesInsert, TablesUpdate } from "../database/supabase";

const tableName = "Traffic";
export type Traffic = Tables<"Traffic">;
export type TrafficInsert = TablesInsert<"Traffic">;
export type TrafficUpdate = TablesUpdate<"Traffic">;

//Insert Traffics
export async function insertTraffics(
  input: TrafficInsert[]
): Promise<Traffic[]> {
  const { data, error } = await db.from(tableName).insert(input).select();
  if (error) throw new Error(error.message);
  return data;
}
