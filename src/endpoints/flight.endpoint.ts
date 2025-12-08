import {
  getFlightNumfromAirline,
  IFlightAirline,
} from "../repositories/airline.repo";
import {
  findAirportByIata,
  findAirportByName,
} from "../repositories/airport.repo";
import {
  findFlightByIdentifier,
  FlightInsert,
  insertFlight,
} from "../repositories/flight.repo";
import { RequestFlight } from "../types/request.body";
import { occurence } from "../utils/string.util";
import { cleanAiroport } from "../utils/utils";
import { fetchFlightInfoFr } from "../services/fr.service";
import fetchFlightInfoFw from "../services/fw.service";

export async function flightEndpoint(reqFlight: RequestFlight) {
  //Get flight from database
  const flight = await findFlightByIdentifier(reqFlight.flightNum);
  if (flight) return flight;
  //if flight not exist

  //Get IFlightAirline
  const airlineFlightNum = await getFlightNumfromAirline(
    reqFlight.flightNum,
    reqFlight.airline
  );

  //Get Flight info from fr and fw
  const [resultFR, resultFW] = await Promise.all([
    fetchFlightInfoFr(airlineFlightNum),
    fetchFlightInfoFw(airlineFlightNum),
  ]);

  //Get best result or default
  const finalFlightInfo = await getBestResult(
    reqFlight,
    { fr: resultFR, fw: resultFW },
    airlineFlightNum
  );

  return await insertFlight(finalFlightInfo);
}

async function getBestResult(
  reqFlight: RequestFlight,
  allResponse: { fr: FlightInsert | undefined; fw: FlightInsert | undefined },
  flightNum: IFlightAirline
): Promise<FlightInsert> {
  let finalResult = defaultFlight(reqFlight, flightNum);
  //From Airport
  let fromAirportReponse = await getAirportFromResult(
    allResponse.fr?.from_code_airport,
    allResponse.fw?.from_code_airport,
    reqFlight.fromCodeAirport,
    reqFlight.fromAirport
  );
  finalResult.from_code_airport = fromAirportReponse.code;
  finalResult.from_airport = fromAirportReponse.name;

  //To Airport
  let toAirportReponse = await getAirportFromResult(
    allResponse.fr?.to_code_airport,
    allResponse.fw?.to_code_airport,
    reqFlight.toCodeAirport,
    reqFlight.toAirport
  );

  finalResult.to_code_airport = toAirportReponse.code;
  finalResult.to_airport = toAirportReponse.name;

  //FlightSchedule
  const flightSch = getFlightSchedule(allResponse);
  if (flightSch) {
    finalResult.departure_time = flightSch.departure;
    finalResult.arrival_time = flightSch.arrival;
  } else {
    finalResult.departure_time =
      reqFlight.typeTraffic == "Arrival" ? "" : reqFlight.heure;
    finalResult.arrival_time =
      reqFlight.typeTraffic == "Departure" ? "" : reqFlight.heure;
  }

  //FlightTime
  const flightTimeReal = getFlightTime(allResponse);
  if (flightTimeReal) {
    finalResult.flight_time = flightTimeReal.flightTime;
    finalResult.duration = flightTimeReal.duration;
  }

  return finalResult;
}

function defaultFlight(
  query: RequestFlight,
  flightNum: IFlightAirline | undefined = undefined
): FlightInsert {
  return {
    flight_num: flightNum?.iata ?? query.flightNum,
    flight_icao: flightNum?.icao ?? "",
    flight_time: "",
    from_code_airport: query.fromCodeAirport ?? "",
    from_airport: cleanAiroport(query.fromAirport),
    to_code_airport: query.toCodeAirport ?? "",
    to_airport: cleanAiroport(query.toAirport),
    departure_time: query.typeTraffic === "Departure" ? query.heure : "",
    arrival_time: query.typeTraffic === "Arrival" ? query.heure : "",
    airline: flightNum?.airline ?? query.airline,
    local_name: flightNum?.localName ?? query.flightNum,
    duration: 0,
  };
}

async function getAirportFromResult(
  codeAirportFr: string | undefined,
  codeAirportFw: string | undefined,
  airportCodeQuery: string | undefined,
  airportQuery: string
) {
  const airportResults = [];
  if (codeAirportFr) {
    airportResults.push(codeAirportFr);
  }
  if (codeAirportFw) {
    airportResults.push(codeAirportFw);
  }
  if (airportResults.length > 0) {
    const realAirport = occurence(airportResults);
    const airportCode =
      realAirport.count === 1 && codeAirportFr
        ? codeAirportFr
        : (realAirport.key as string);
    const airportDB = await findAirportByIata(airportCode);
    if (airportDB) {
      return {
        name: cleanAiroport(airportDB.airport_name),
        code: airportDB.iata,
      };
    }
  }

  const airportFromQuery = airportCodeQuery
    ? await findAirportByIata(airportCodeQuery)
    : await findAirportByName(airportQuery);
  if (airportFromQuery) {
    return {
      name: cleanAiroport(airportFromQuery.airport_name),
      code: airportFromQuery.iata,
    };
  }
  return {
    name: airportCodeQuery ?? "",
    code: airportQuery,
  };
}

function getFlightSchedule(thirdParty: {
  fr: FlightInsert | undefined;
  fw: FlightInsert | undefined;
}) {
  let departureList = [];
  if (thirdParty.fr) {
    departureList.push(thirdParty.fr.departure_time);
  }
  if (thirdParty.fw) {
    departureList.push(thirdParty.fw.departure_time);
  }
  if (departureList.length > 0) {
    const realDeparture = occurence(departureList);
    const departure =
      realDeparture.count === 1 && thirdParty.fr
        ? thirdParty.fr.departure_time
        : realDeparture.key;

    let arrival;
    if (thirdParty.fr && thirdParty.fr.departure_time === departure) {
      arrival = thirdParty.fr.arrival_time;
    } else if (thirdParty.fw && thirdParty.fw.departure_time === departure) {
      arrival = thirdParty.fw.arrival_time;
    } else {
      return undefined;
    }
    return { departure, arrival };
  }
  return undefined;
}

function getFlightTime(thirdParty: {
  fr: FlightInsert | undefined;
  fw: FlightInsert | undefined;
}) {
  let timeList = [];
  if (thirdParty.fr) {
    timeList.push(thirdParty.fr.flight_time);
  }
  if (thirdParty.fw) {
    timeList.push(thirdParty.fw.flight_time);
  }

  if (timeList.length > 0) {
    const realTime = occurence(timeList);
    const flightTime =
      realTime.count === 1 && thirdParty.fr
        ? thirdParty.fr.flight_time
        : realTime.key;

    let duration = 0;
    if (thirdParty.fr && thirdParty.fr.flight_time === flightTime) {
      duration = thirdParty.fr.duration;
    } else if (thirdParty.fw && thirdParty.fw.flight_time === flightTime) {
      duration = thirdParty.fw.duration;
    } else {
      return undefined;
    }
    return { flightTime, duration };
  }
  return undefined;
}
