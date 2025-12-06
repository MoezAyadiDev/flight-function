import { countAirlines, insertAirlines } from "../repositories/airline.repo";
import { countAirports, insertAirports } from "../repositories/airport.repo";
import { fetchAirlines, fetchAirports } from "./fr.service";
import {
  AeroportInsert,
  countAeroports,
  insertAeroports,
} from "../repositories/aeroport.repo";

export async function initDatabaseService() {
  //Airlines
  const airlineNumber = await countAirlines();
  if (airlineNumber === 0) {
    const airlineApi = await fetchAirlines();
    const airlineInsert = await insertAirlines(airlineApi);
    if (airlineInsert) {
      console.log(`Airline insert ${airlineApi.length} rows`);
    }
  }
  //Airport
  const airportNumber = await countAirports();
  if (airportNumber === 0) {
    const airportApi = await fetchAirports();
    const airportInsert = await insertAirports(airportApi);
    if (airportInsert) {
      console.log(`Airport insert ${airportApi.length} rows`);
    }
  }
  const aeroportNumber = await countAeroports();
  if (airlineNumber === 0) {
    const responseInsert = await insertAeroports(aeroports);
    if (responseInsert) {
      console.log(`Aeroport insert ${aeroports.length} rows`);
    }
  }
  //Aeroport
  return { message: "Database initilising ..." };
}

const aeroports: AeroportInsert[] = [
  {
    code: "TUN",
    nom: "Tunis",
    icao: "DTTA",
    operateur: "OACA",
    api_url: "https://www.oaca.nat.tn/vols/api/flight/filter",
  },
  {
    code: "DJE",
    nom: "Djerba",
    icao: "DTTJ",
    operateur: "OACA",
    api_url: "https://www.oaca.nat.tn/vols/api/flight/filter",
  },
  {
    code: "MIR",
    nom: "Monastir",
    icao: "DTMB",
    operateur: "TAV",
    api_url: "https://habibbourguibaairport.com/Home/searchFlights",
  },
  {
    code: "NBE",
    nom: "Enfidha",
    icao: "DTNH",
    operateur: "TAV",
    api_url: "https://enfidhahammametairport.com/Home/searchFlights",
  },
];
