// import { db } from "../database/db";
// import { Tables, TablesInsert, TablesUpdate } from "../database/supabase";
// import { Flight } from "./flight.repo";
// import { Traffic } from "./traffic.repo";

// const tableName = "Subscription";
// export type Subscription = Tables<"Subscription">;
// export type SubscriptionInsert = TablesInsert<"Subscription">;
// export type SubscriptionUpdate = TablesUpdate<"Subscription">;

// export type TrafficWithFlight = Traffic & {
//   Flight: Flight;
// };

// export type SubscriptionWithTrack = Subscription & {
//   Traffic: TrafficWithFlight;
// };

// //Get the subscription Traffic by date airport an type traffic
// export async function findSubscriptionsByDate(
//   date: number,
//   codeAirport: string,
//   typeTrafic: string,
//   idCentre: number
// ): Promise<Subscription[]> {
//   const { data, error } = await db.from(tableName).select("*").match({
//     airport: codeAirport,
//     date_traffic: date,
//     type_traffic: typeTrafic,
//     id_centre: idCentre,
//   });
//   if (error) throw new Error(error.message);
//   if (!data) return [];
//   return data;
// }

// //Insert Subscriptions
// export async function insertSubscriptions(
//   input: SubscriptionInsert[]
// ): Promise<boolean> {
//   console.log(input);
//   const responseInsert = await db.from(tableName).insert(input);
//   console.log(responseInsert);
//   return responseInsert.status === 201 ? true : false;
// }

// //Get the list of Airports
// export async function getSubscriptionActif(): Promise<SubscriptionWithTrack[]> {
//   const { data, error } = await db
//     .from(tableName)
//     .select("*, Traffic(*, Flight(*))")
//     .eq("subscription_status", 0)
//     .limit(1);
//   if (error) throw Error(error.message);
//   return data;
// }

// export async function finishSubscription(id: number) {
//   const { error } = await db
//     .from(tableName)
//     .update({ subscription_status: 1 })
//     .eq("id", id);
//   if (error) throw new Error(error.message);
// }
