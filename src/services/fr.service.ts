import { IFlightAirline } from "../repositories/airline.repo";
import { awaitCall } from "../repositories/api.time.repo";
import { FlightInsert } from "../repositories/flight.repo";
import { TimeCallFailure } from "../types/failures";
import { avgTime, timeStampToTime } from "../utils/date.util";
import { encodeQuery } from "../utils/string.util";

//Http get function
async function httpGet(url: string, headers = {}) {
  const res = await fetch(url, { headers });
  if (!res.ok) console.log(`Failed GET ${url}`);
  return await res.json();
}

//Get all Airline
export async function fetchAirlines() {
  const url = "https://www.flightradar24.com/_json/airlines.php";
  const apiResponse = await httpGet(url);
  return apiResponse.rows.map((item: any) => ({
    airline_name: item.Name,
    code: item.Code,
    icao: item.ICAO,
  }));
}

//Get the list of Airport
export async function fetchAirports() {
  const url = "https://www.flightradar24.com/_json/airports.php";
  const apiResponse = await httpGet(url);
  return apiResponse.rows.map((item: any) => ({
    airport_name: item.name,
    iata: item.iata,
    icao: item.icao,
    lat: item.lat,
    lon: item.lon,
    country: item.country,
    alt: item.alt,
  }));
}

export async function fetchFlightInfoFr(
  airlineFlightNum: IFlightAirline
): Promise<FlightInsert | undefined> {
  try {
    await awaitCall();
    const responseFR = await getFlightInfo(airlineFlightNum);
    if (responseFR) {
      return responseFR;
    } else {
      await awaitCall();
      const responseIcaoFR = await getFlightInfo(airlineFlightNum, false);
      return responseIcaoFR;
    }
  } catch (ex) {
    console.error(`ERROR: ${ex}`);
    return undefined;
  }
}

async function getFlightInfo(
  flightComplet: IFlightAirline,
  isIata = true
): Promise<FlightInsert | undefined> {
  let searchNum = flightComplet.iata;
  if (!isIata && flightComplet.icao) {
    const newFlight = await searchFlight(flightComplet.icao);
    if (!newFlight) return undefined;
    searchNum = newFlight?.iata;
  }
  const flightSearchResponse = await flightInfoSearch(
    searchNum ?? flightComplet.localName
  );
  if (!flightSearchResponse) {
    return undefined;
  }
  const isDerivited = flightSearchResponse
    .filter((item: any) => item.status.generic.status.diverted)
    .map((item: any) => item.status.generic.status.diverted);
  if (isDerivited.length != 0) {
  }
  let history = flightSearchResponse.filter((item: any) => {
    const isDerive =
      isDerivited.length != 0
        ? !isDerivited.includes(item.airport.destination.code.iata) &&
          !isDerivited.includes(item.airport.origin.code.iata)
        : true;
    return (
      item.time.real.arrival != null &&
      item.time.real.departure != null &&
      isDerive
    );
  });
  let defaultTrafic;
  if (history.length === 0) {
    history = flightSearchResponse.filter((item: any) => {
      const isDerive =
        isDerivited.length != 0
          ? !isDerivited.includes(item.airport.destination.code.iata) &&
            !isDerivited.includes(item.airport.origin.code.iata)
          : true;
      return (
        item.time.scheduled.arrival && item.time.scheduled.departure && isDerive
      );
    });

    if (history.length === 0) {
      return undefined;
    }
    defaultTrafic = history.last();
  } else {
    defaultTrafic = history[0];
  }
  let times = avgTime(
    history
      .filter((item: any) => item.time.other.duration)
      .map((item: any) => item.time.other.duration)
  );
  if (!times) {
    times = avgTime(
      history
        .filter(
          (item: any) =>
            item.time.scheduled.arrival && item.time.scheduled.departure
        )
        .map(
          (item: any) =>
            item.time.scheduled.arrival - item.time.scheduled.departure
        )
    );
  }
  let departureTime = "";
  let arrivalTime = "";
  if (
    defaultTrafic.time.scheduled.arrival &&
    defaultTrafic.time.scheduled.departure
  ) {
    departureTime = timeStampToTime(defaultTrafic.time.scheduled.departure);
    arrivalTime = timeStampToTime(defaultTrafic.time.scheduled.arrival);
  } else if (
    defaultTrafic.time.real.departure &&
    defaultTrafic.time.real.arrival
  ) {
    departureTime = timeStampToTime(defaultTrafic.time.real.departure);
    arrivalTime = timeStampToTime(defaultTrafic.time.real.arrival);
  } else {
    return undefined;
  }
  return {
    flight_num: flightComplet.iata ?? "",
    flight_icao: flightComplet.icao ?? "",
    flight_time: times!.time,
    from_code_airport: defaultTrafic.airport.origin.code.iata,
    from_airport: defaultTrafic.airport.origin.name,
    to_code_airport: defaultTrafic.airport.destination.code.iata,
    to_airport: defaultTrafic.airport.destination.name,
    departure_time: departureTime,
    arrival_time: arrivalTime,
    airline: flightComplet.airline ?? "",
    local_name: flightComplet.localName,
    duration: times!.duration,
  };
}

//Search The flight from Iata
async function searchFlight(flightNum: string) {
  const flightResult = await search({ query: flightNum });
  const searchResult = flightResult.results.find(
    (item: any) =>
      item.detail.callsign === flightNum || item.detail.flight === flightNum
  );
  if (searchResult) {
    if (
      searchResult.detail.flight.substring(2) ===
      searchResult.detail.callsign.substring(3)
    ) {
      return {
        iata: searchResult.detail.flight,
        icao: searchResult.detail.callsign,
      };
    } else {
      return undefined;
    }
  } else {
    return undefined;
  }
}

//Fetch Flight Info
async function flightInfoSearch(flightNum: string) {
  let page = 1;
  let queryApi = `fetchBy=flight`;
  queryApi += `&page=${page}`;
  queryApi += `&limit=25`;
  queryApi += `&query=${flightNum}`;
  const url = `https://api.flightradar24.com/common/v1/flight/list.json?${queryApi}`;

  const response = await fetch(url);
  if (response.status != 200) {
    throw new TimeCallFailure();
  }
  const jsonResponse = await response.json();

  return jsonResponse.result.response.data;
}

//Fetch Flight
async function search({
  query,
  searchType = "schedule",
  limit = 5,
}: {
  query: string;
  searchType?: "schedule" | "live" | "airport" | "operator";
  limit?: number;
}) {
  const queryParam = {
    query: query,
    limit: limit,
    type: searchType,
  };
  const urlApi = encodeQuery(queryParam);

  const response = await fetch(
    `https://www.flightradar24.com/v1/search/web/find?${urlApi}`
  );
  return await response.json();
}
