import { db } from "./db";

export async function getAirports() {
  const { data } = await db.from("Airport").select("*");
  return data;
}
