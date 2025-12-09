import { db } from "../database/db";
import { Tables, TablesInsert, TablesUpdate } from "../database/supabase";

const tableName = "Subscription";
export type Subscription = Tables<"Subscription">;
export type SubscriptionInsert = TablesInsert<"Subscription">;
export type SubscriptionUpdate = TablesUpdate<"Subscription">;

//Get the subscription Traffic by date airport an type traffic
export async function findSubscriptionsByDate(
  date: number,
  codeAirport: string,
  typeTrafic: string
): Promise<Subscription[]> {
  const { data, error } = await db.from(tableName).select("*").match({
    airport: codeAirport,
    date_traffic: date,
    type_traffic: typeTrafic,
  });
  if (error) throw new Error(error.message);
  if (!data) return [];
  return data;
}

//Insert Subscriptions
export async function insertSubscriptions(
  input: SubscriptionInsert[]
): Promise<boolean> {
  const responseInsert = await db.from(tableName).insert(input);
  return responseInsert.status === 201 ? true : false;
}
