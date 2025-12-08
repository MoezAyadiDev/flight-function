import { Tables, TablesInsert, TablesUpdate } from "../database/supabase";
import { db } from "../database/db";
import { cleanAirline } from "../utils/utils";
import { compares } from "../utils/string.util";

const tableName = "Airline";
export type Airline = Tables<"Airline">;
export type AirlineInsert = TablesInsert<"Airline">;
export type AirlineUpdate = TablesUpdate<"Airline">;

//Get the number of Airline in database
export async function countAirlines(): Promise<number> {
  const { count, error } = await db
    .from(tableName)
    .select("*", { count: "exact" });
  return count ?? 0;
}

//Insert list of airlines
export async function insertAirlines(input: AirlineInsert[]): Promise<boolean> {
  const responseInsert = await db.from(tableName).insert(input);
  return responseInsert.status === 201 ? true : false;
}

//Find airline by icao
export async function findAirlinesByIcao(icao: string): Promise<Airline[]> {
  const { data, error } = await db.from(tableName).select("*").eq("icao", icao);
  if (error) throw new Error(error.message);
  if (!data) return [];
  return data;
}

//Find Airline by iata
export async function findAirlinesByIata(iata: string): Promise<Airline[]> {
  const { data, error } = await db.from(tableName).select("*").eq("code", iata);
  if (error) throw new Error(error.message);
  if (!data) return [];
  return data;
}

export async function getFlightNumfromAirline(
  flightSearch: string,
  owner = ""
): Promise<IFlightAirline> {
  let correctFlightNum = flightSearch;
  if (correctFlightNum.substring(0, 2) === "UG") {
    correctFlightNum = `UG${Number(correctFlightNum.replaceAll("UG", ""))}`;
  }
  if (correctFlightNum.substring(0, 2) === "TU") {
    correctFlightNum = `TU${Number(correctFlightNum.replaceAll("TU", ""))}`;
  }
  let flightIata = "";
  let flightIcao = "";
  let airline = "";
  const regex = /^[a-zA-Z]+$/;
  // Check if iata or icao
  if (!regex.test(correctFlightNum.substring(0, 3))) {
    const airlineCode = correctFlightNum.substring(0, 2);
    const airlines = await findAirlinesByIata(airlineCode);
    if (airlines.length === 1) {
      flightIata = correctFlightNum;
      flightIcao = correctFlightNum.replace(airlineCode, airlines[0].icao);
      airline = airlines[0].airline_name;
    } else if (airlines.length > 1) {
      let checkNotFound = true;
      if (owner.length !== 0) {
        const compraeResult = compares(
          cleanAirline(owner),
          airlines.map((item) => cleanAirline(item.airline_name))
        );
        if (compraeResult && compraeResult.percent > 50) {
          flightIata = correctFlightNum;
          flightIcao = correctFlightNum.replace(
            airlineCode,
            airlines[compraeResult.index].icao
          );
          airline = airlines[compraeResult.index].airline_name;
          checkNotFound = false;
        }
      }
      if (checkNotFound) {
        return defaultFlightNumFromAirline(flightSearch);
      }
    } else {
      return defaultFlightNumFromAirline(flightSearch);
    }
  } else {
    const airlineIcao = correctFlightNum.substring(0, 3);
    const airlines = await findAirlinesByIcao(airlineIcao);
    if (airlines.length === 1) {
      flightIata = correctFlightNum.replace(airlineIcao, airlines[0].code);
      flightIcao = correctFlightNum;
      airline = airlines[0].airline_name;
    } else if (airlines.length > 1) {
      let checkNotFound = true;
      if (owner.length !== 0) {
        const compraeResult = compares(
          cleanAirline(owner),
          airlines.map((item) => cleanAirline(item.airline_name))
        );
        if (compraeResult && compraeResult.percent > 50) {
          flightIata = correctFlightNum.replace(
            airlineIcao,
            airlines[compraeResult.index].code
          );
          flightIcao = correctFlightNum;
          airline = airlines[compraeResult.index].airline_name;
          checkNotFound = false;
        }
      }
      if (checkNotFound) {
        return defaultFlightNumFromAirline(flightSearch);
      }
    } else {
      flightIata = "";
      flightIcao = correctFlightNum;
    }
  }
  if (
    airline.length === 0 ||
    flightIata.length === 0 ||
    flightIcao.length === 0
  ) {
    return defaultFlightNumFromAirline(flightSearch);
  }
  return {
    airline: airline,
    iata: flightIata,
    icao: flightIcao,
    localName: flightSearch,
  };
}

export interface IFlightAirline {
  airline: string | undefined;
  iata: string | undefined;
  icao: string | undefined;
  localName: string;
}

function defaultFlightNumFromAirline(flightSearch: string): IFlightAirline {
  return {
    airline: undefined,
    iata: undefined,
    icao: undefined,
    localName: flightSearch,
  };
}
