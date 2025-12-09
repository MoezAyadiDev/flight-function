import {
  getFlightNumfromAirline,
  IFlightAirline,
} from "../repositories/airline.repo";
import { findAirportByIata } from "../repositories/airport.repo";
import {
  findFlightByIdentifier,
  FlightInsert,
  insertFlight,
} from "../repositories/flight.repo";
import { RequestFlight } from "../types/request.body";
import { occurence } from "../utils/string.util";
import { cleanAirport } from "../utils/utils";
import { fetchFlightInfoFr } from "../services/fr.service";
import fetchFlightInfoFw from "../services/fw.service";
import { fetchFlightInfoAi } from "../services/ai.service";

export async function flightEndpoint(reqFlight: RequestFlight) {
  //Get flight from database
  const flight = await findFlightByIdentifier(reqFlight.flightNum);
  if (flight) return flight;
  //if flight not exist

  //Get IFlightAirline
  const airlineFlightNum = await getFlightNumfromAirline(reqFlight.flightNum);

  //Get Flight info from fr and fw
  const [resultFR, resultFW, resultAi] = await Promise.all([
    fetchFlightInfoFr(airlineFlightNum),
    fetchFlightInfoFw(airlineFlightNum),
    fetchFlightInfoAi(airlineFlightNum),
  ]);

  if (!resultFR && !resultFW && !resultAi) {
    console.error(`Flight info not found ${reqFlight.flightNum}`);
    return undefined;
  }
  //Get best result or default
  const finalFlightInfo = await getBestResult(
    reqFlight,
    { fr: resultFR, fw: resultFW, ai: resultAi },
    airlineFlightNum
  );

  return await insertFlight(finalFlightInfo);
}

async function getBestResult(
  reqFlight: RequestFlight,
  allResponse: {
    fr: FlightInsert | undefined;
    fw: FlightInsert | undefined;
    ai: FlightInsert | undefined;
  },
  flightNum: IFlightAirline
): Promise<FlightInsert> {
  const isArrival: boolean = reqFlight.typeTraffic === "Arrival";
  let finalResult = defaultFlight(reqFlight, flightNum);
  //From Airport
  let fromAirportReponse = await getAirportFromResult(
    allResponse.fr?.from_code_airport,
    allResponse.fw?.from_code_airport,
    allResponse.ai?.from_code_airport,
    isArrival ? undefined : reqFlight.airport
  );
  finalResult.from_code_airport = fromAirportReponse.code;
  finalResult.from_airport = fromAirportReponse.name;

  //To Airport
  let toAirportReponse = await getAirportFromResult(
    allResponse.fr?.to_code_airport,
    allResponse.fw?.to_code_airport,
    allResponse.ai?.to_code_airport,
    isArrival ? reqFlight.airport : undefined
  );

  finalResult.to_code_airport = toAirportReponse.code;
  finalResult.to_airport = toAirportReponse.name;

  //FlightSchedule
  const flightSch = getFlightSchedule(allResponse);
  if (flightSch) {
    finalResult.departure_time = flightSch.departure;
    finalResult.arrival_time = flightSch.arrival;
  } else {
    finalResult.departure_time = "";
    finalResult.arrival_time = "";
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
  const isArrival: boolean = query.typeTraffic === "Arrival";
  return {
    flight_num: flightNum?.iata ?? query.flightNum,
    flight_icao: flightNum?.icao ?? "",
    flight_time: "",
    from_code_airport: isArrival ? query.airport : "",
    from_airport: "",
    to_code_airport: isArrival ? "" : query.airport,
    to_airport: "",
    departure_time: "",
    arrival_time: "",
    airline: flightNum?.airline ?? "",
    local_name: flightNum?.localName ?? query.flightNum,
    duration: 0,
  };
}

async function getAirportFromResult(
  codeAirportFr: string | undefined,
  codeAirportFw: string | undefined,
  codeAirportAi: string | undefined,
  airportCodeQuery: string | undefined
) {
  const airportResults = [];
  if (codeAirportFr) {
    airportResults.push(codeAirportFr);
  }
  if (codeAirportFw) {
    airportResults.push(codeAirportFw);
  }
  if (codeAirportAi) {
    airportResults.push(codeAirportAi);
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
        name: cleanAirport(airportDB.airport_name),
        code: airportDB.iata,
      };
    }
  }

  const airportFromQuery = airportCodeQuery
    ? await findAirportByIata(airportCodeQuery)
    : undefined;
  if (airportFromQuery) {
    return {
      name: cleanAirport(airportFromQuery.airport_name),
      code: airportFromQuery.iata,
    };
  }
  return {
    name: "",
    code: airportCodeQuery ?? "",
  };
}

function getFlightSchedule(thirdParty: {
  fr: FlightInsert | undefined;
  fw: FlightInsert | undefined;
  ai: FlightInsert | undefined;
}) {
  let departureList = [];
  if (thirdParty.fr) {
    departureList.push(thirdParty.fr.departure_time);
  }
  if (thirdParty.fw) {
    departureList.push(thirdParty.fw.departure_time);
  }
  if (thirdParty.ai) {
    departureList.push(thirdParty.ai.departure_time);
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
    } else if (thirdParty.ai && thirdParty.ai.departure_time === departure) {
      arrival = thirdParty.ai.arrival_time;
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
  ai: FlightInsert | undefined;
}) {
  let timeList = [];
  if (thirdParty.fr) {
    timeList.push(thirdParty.fr.flight_time);
  }
  if (thirdParty.fw) {
    timeList.push(thirdParty.fw.flight_time);
  }
  if (thirdParty.ai) {
    timeList.push(thirdParty.ai.flight_time);
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
    } else if (thirdParty.ai && thirdParty.ai.flight_time === flightTime) {
      duration = thirdParty.ai.duration;
    } else {
      return undefined;
    }
    return { flightTime, duration };
  }
  return undefined;
}
