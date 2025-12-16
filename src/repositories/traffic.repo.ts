import { db } from "../database/db";
import {
  Tables,
  TablesInsert,
  TablesUpdate,
  TrafficType,
} from "../database/supabase";
import { Flight } from "./flight.repo";

const tableName = "Traffic";
export type Traffic = Tables<"Traffic">;
export type TrafficInsert = TablesInsert<"Traffic">;
export type TrafficUpdate = TablesUpdate<"Traffic">;
export type TrafficWithFlight = Traffic & {
  Flight: Flight;
};

//Insert Traffics
export async function insertTraffics(input: TrafficInsert[]): Promise<boolean> {
  const { error } = await db.from(tableName).insert(input).select();
  if (error) {
    throw new Error(error.message);
  }
  return true;
}

//Insert Traffics
export async function insertTraffic(input: TrafficInsert): Promise<Traffic> {
  const { data, error } = await db
    .from(tableName)
    .insert(input)
    .select()
    .single();
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

export async function updateTraffic(id: number, traffic: TrafficUpdate) {
  const { error } = await db.from(tableName).update(traffic).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function findTrafficsByDate(
  date: number,
  codeAirport: string,
  typeTrafic: TrafficType
  // idCentre: number
) {
  const { data, error } = await db
    .from(tableName)
    .select("*, Flight(*)")
    .match({
      traffic_airport: codeAirport,
      traffic_date: date,
      type_traffic: typeTrafic,
    });
  // .contains("id_centre", [idCentre]);
  if (error) throw new Error(error.message);
  if (!data) return [];
  return data;
}

//Get the list of Airports
export async function getTrafficsActif(): Promise<TrafficWithFlight[]> {
  const { data, error } = await db
    .from(tableName)
    .select("*,  Flight(*)")
    .not("flight_status", "in", '("Landed","Canceled")');
  //.limit(20);
  if (error) throw Error(error.message);
  return data;
}
