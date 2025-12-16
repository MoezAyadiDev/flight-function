import {
  findAirlineByIataIcao,
  findAirlinesByIata,
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
import { fetchFlightInfoFr } from "../services/fr.service";
import fetchFlightInfoFw from "../services/fw.service";
import { fetchFlightInfoAi } from "../services/ai.service";
import { IFlightService } from "../types/service.type";
import { SearchFailure } from "../types/failures";

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
  if (!finalFlightInfo) return undefined;
  return await insertFlight(finalFlightInfo);
}

async function getBestResult(
  reqFlight: RequestFlight,
  allResponse: {
    fr: IFlightService | undefined;
    fw: IFlightService | undefined;
    ai: IFlightService | undefined;
  },
  flightNum: IFlightAirline
): Promise<FlightInsert | undefined> {
  //TDOO search airline
  const isArrival: boolean = reqFlight.typeTraffic === "Arrival";
  let finalResult = defaultFlight(reqFlight, flightNum);
  if (allResponse.fr) {
    if (
      reqFlight.flightNum.substring(0, 3) === "EZS" &&
      allResponse.fr.flight_num.substring(0, 2)
    ) {
      finalResult.flight_num = allResponse.fr.flight_num;
    }
  }
  //From Airport
  let fromAirportReponse = await getAirportFromResult(
    allResponse.fr?.from_code_airport,
    allResponse.fw?.from_code_airport,
    allResponse.ai?.from_code_airport,
    isArrival ? undefined : reqFlight.airport
  );

  if (!fromAirportReponse) {
    return undefined;
    throw new SearchFailure(`From airport : ${flightNum.localName}`);
  }
  finalResult.from_airport = fromAirportReponse;

  //To Airport
  let toAirportReponse = await getAirportFromResult(
    allResponse.fr?.to_code_airport,
    allResponse.fw?.to_code_airport,
    allResponse.ai?.to_code_airport,
    isArrival ? reqFlight.airport : undefined
  );
  if (!toAirportReponse) throw new SearchFailure(`To airport : ${flightNum}`);
  finalResult.to_airport = toAirportReponse; //toAirportReponse.name;

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

  //Airline
  const airlineReal = await getAirlineFromResult(
    allResponse.fr?.airline,
    allResponse.fw?.airline,
    allResponse.ai?.airline
  );
  if (!airlineReal) throw new SearchFailure(`Airline : ${flightNum}`);
  finalResult.airline_id = airlineReal.id;

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
    from_airport: 0,
    to_airport: 0,
    departure_time: "",
    arrival_time: "",
    airline_id: 0, //flightNum?.airline ?? "",
    duration: 0,
    local_name: [query.flightNum],
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
      return airportDB.id;
    }
  }

  const airportFromQuery = airportCodeQuery
    ? await findAirportByIata(airportCodeQuery)
    : undefined;
  if (airportFromQuery) {
    airportFromQuery.id;
  }
  return undefined;
}

async function getAirlineFromResult(
  airlineFr:
    | {
        name: string;
        iata: string;
        icao: string;
      }
    | undefined,
  airlineFw:
    | {
        name: string;
        iata: string;
        icao: string;
      }
    | undefined,
  airlineAi:
    | {
        name: string;
        iata: string;
        icao: string;
      }
    | undefined
) {
  if (airlineFr) {
    return await findAirlineByIataIcao(airlineFr.iata, airlineFr.icao);
  }

  if (airlineFw) {
    return await findAirlineByIataIcao(airlineFw.iata, airlineFw.icao);
  }
  if (airlineAi) {
    const airls = await findAirlinesByIata(airlineAi.iata);
    if (airls.length > 0) return airls[0];
  }
  return undefined;
}

function getFlightSchedule(thirdParty: {
  fr: IFlightService | undefined;
  fw: IFlightService | undefined;
  ai: IFlightService | undefined;
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
  fr: IFlightService | undefined;
  fw: IFlightService | undefined;
  ai: IFlightService | undefined;
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
      duration = thirdParty.fr.duration ?? 0;
    } else if (thirdParty.fw && thirdParty.fw.flight_time === flightTime) {
      duration = thirdParty.fw.duration ?? 0;
    } else if (thirdParty.ai && thirdParty.ai.flight_time === flightTime) {
      duration = thirdParty.ai.duration ?? 0;
    } else {
      return undefined;
    }
    return { flightTime, duration };
  }
  return undefined;
}
