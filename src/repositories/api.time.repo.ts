import { db } from "../database/db";
import { Tables, TablesInsert, TablesUpdate } from "../database/supabase";
import {
  dateToTimeStamp,
  delay,
  timeStampDifferenceNow,
} from "../utils/date.util";

const tableName = "ApiTime";
export type ApiTime = Tables<"ApiTime">;
export type ApiTimeInsert = TablesInsert<"ApiTime">;
export type ApiTimeUpdate = TablesUpdate<"ApiTime">;

async function getConfig(): Promise<number> {
  const { data, error } = await db
    .from(tableName)
    .select("info_time")
    .single<{ info_time: number }>();

  if (error) {
    if (error.details === "The result contains 0 rows") {
      return dateToTimeStamp(new Date());
    }
    throw error;
  }
  if (data) return data.info_time;

  return dateToTimeStamp(new Date());
}

async function setConfig() {
  const { error } = await db
    .from(tableName)
    .upsert({ id: 1, info_time: dateToTimeStamp(new Date()) });
  if (error) {
    console.log(`upset error ${error}`);
  }
}

export async function awaitCall(timeDelay = 4) {
  const lastTimeCall = await getConfig();
  const secondeDifference = timeStampDifferenceNow(lastTimeCall);
  if (secondeDifference < timeDelay) {
    await delay((timeDelay - secondeDifference) * 1000);
  }
  await setConfig();
}
