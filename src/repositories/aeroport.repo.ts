import { Tables, TablesInsert, TablesUpdate } from "../database/supabase";
import { db } from "../database/db";

const tableName = "Aeroport";
export type Aeroport = Tables<"Aeroport">;
export type AeroportInsert = TablesInsert<"Aeroport">;
export type AeroportUpdate = TablesUpdate<"Aeroport">;

//Get the number of Aeroport in database
export async function countAeroports(): Promise<number> {
  const { count } = await db.from(tableName).select("*", { count: "exact" });
  return count ?? 0;
}

//Insert list of Aeroport
export async function insertAeroports(
  input: AeroportInsert[]
): Promise<boolean> {
  const responseInsert = await db.from(tableName).insert(input);
  return responseInsert.status === 201 ? true : false;
}
