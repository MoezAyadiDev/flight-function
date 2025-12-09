import { db } from "../database/db";
import { Tables, TablesInsert, TablesUpdate } from "../database/supabase";

const tableName = "UnknownFlight";
export type UnknownFlight = Tables<"UnknownFlight">;
export type UnknownFlightInsert = TablesInsert<"UnknownFlight">;
export type UnknownFlightUpdate = TablesUpdate<"UnknownFlight">;

//Insert Unknown flight
export async function insertUnknownFlight(input: UnknownFlightInsert) {
  const resp = await checkUnknownFlight(input);
  if (!(await checkUnknownFlight(input))) {
    await db.from(tableName).insert(input);
  }
}

//Get Unknown flight
export async function checkUnknownFlight(
  input: UnknownFlightInsert
): Promise<boolean> {
  const { data, error } = await db.from(tableName).select("*").match({
    airport: input.airport,
    flight_num: input.flight_num,
    type_traffic: input.type_traffic,
    date_traffic: input.date_traffic,
  });
  if (error) return false;
  return data.length > 0;
}
