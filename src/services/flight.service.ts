import { getAirports } from "../database/airport.repo";
export async function flightService() {
  const air = await getAirports();
  return air;
}
