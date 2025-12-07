// import { getAirports } from "../repositories/airport.repo";
import { getAirports } from "../repositories/airport.repo";

export async function flightService() {
  const air = await getAirports();
  return air;
}
