import { db } from "../database/db";
import {
  Tables,
  TablesInsert,
  TablesUpdate,
  TrafficType,
} from "../database/supabase";
import { ITrackingFlight } from "../types/service.type";
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

//Get the list of Airports
export async function findFlightTracking(): Promise<ITrackingFlight[]> {
  const { data, error } = await db
    .from(tableName)
    .select(
      "id, flight_num, traffic_date, type_traffic, fr_num, traffic_airport, sch_departure_time, sch_arrival_time, act_departure_time, act_arrival_time, est_departure_time, est_arrival_time, flight_status"
    )
    .not("flight_status", "in", '("Landed","Canceled")');
  //.limit(20);
  if (error) throw Error(error.message);
  return data;
}

// {
//         "id": 127,
//         "created_at": "2025-12-15T20:26:48.170046+00:00",
//         "flight_num": "U25729",
//         "traffic_date": 20251216,
//         "id_centre": [
//             1,
//             2
//         ],
//         "type_traffic": "Arrival",
//         "local_num": [
//             "EZY5729",
//             "U25729"
//         ],
//         "fr_num": "U25729",
//         "traffic_airport": "NBE",
//         "departure_date": 20251216,
//         "arrival_date": 20251216,
//         "traffic_diverted_to": "",
//         "sch_departure_time": "15:50",
//         "sch_arrival_time": "18:45",
//         "act_departure_time": "",
//         "act_arrival_time": "",
//         "est_departure_time": "15:50",
//         "est_arrival_time": "19:45",
//         "flight_status": "Scheduled",
//         "flight_id": 96,
//         "Flight": {
//             "id": 96,
//             "duration": 9600,
//             "airline_id": 842,
//             "created_at": "2025-12-15T20:24:20.683677+00:00",
//             "flight_num": "U25729",
//             "local_name": [
//                 "EZY5729"
//             ],
//             "to_airport": 1680,
//             "flight_icao": "EZY5729",
//             "flight_time": "02:40",
//             "arrival_time": "18:35",
//             "from_airport": 3292,
//             "departure_time": "16:00"
//         }
//     }
