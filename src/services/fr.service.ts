import { IFlightAirline } from "../repositories/airline.repo";
import { awaitCall } from "../repositories/api.time.repo";
import { FlightInsert } from "../repositories/flight.repo";
import { TrafficInsert } from "../repositories/traffic.repo";
import { TimeCallFailure } from "../types/failures";
import { TrafficItem } from "../types/service.type";
import {
  avgTime,
  chaineToDate,
  dateToTimeStampMinuit,
  timeStampToNumber,
  timeStampToTime,
} from "../utils/date.util";
import { encodeQuery } from "../utils/string.util";
import { cleanAirport } from "../utils/utils";

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

export async function getTrafficFr(trafficItem: TrafficItem) {
  const maDate = chaineToDate(trafficItem.date.toString());
  let page = 1;
  const detailArrival = await traficCall(
    trafficItem.codeAirport,
    maDate,
    page,
    trafficItem.typeTrafic === "Arrival" ? "arrivals" : "departures"
  );
  if (detailArrival.totalPage === 0) {
    return [];
  }
  const totalPage = detailArrival.totalPage;
  let arrivalList: TrafficInsert[] = detailArrival.flights.filter(
    (item: TrafficInsert) =>
      trafficItem.typeTrafic === "Arrival"
        ? item.arrival_date === trafficItem.date
        : item.departure_date === trafficItem.date
  );
  if (totalPage != page) {
    for (var i = 1; i <= totalPage; i++) {
      page++;
      const detailArrivalPage = await traficCall(
        trafficItem.codeAirport,
        maDate,
        page,
        trafficItem.typeTrafic === "Arrival" ? "arrivals" : "departures"
      );
      if (detailArrivalPage) {
        arrivalList.push(
          ...detailArrivalPage.flights.filter((item: any) =>
            trafficItem.typeTrafic === "Arrival"
              ? item.arrivalDate === trafficItem.date
              : item.departureDate === trafficItem.date
          )
        );
      }
    }
  }
  return arrivalList;
}

async function traficCall(
  airport: string,
  date: Date,
  page: number,
  typeTrafic: "arrivals" | "departures"
): Promise<{ totalPage: number; flights: TrafficInsert[] }> {
  await awaitCall();
  const dateSearch = dateToTimeStampMinuit(date);
  let queryApi = `code=${airport}`;

  // queryApi += `&plugin[]=schedule`;
  queryApi += `&plugin[]=`;
  queryApi += `&plugin-setting[schedule][mode]=${typeTrafic}`;
  queryApi += `&plugin-setting[schedule][timestamp]=${dateSearch}`;
  queryApi += `&limit=100`;
  queryApi += `&page=${page}`;
  const url = `https://api.flightradar24.com/common/v1/airport.json?${queryApi}`;
  const response = await fetch(url);
  const jsonResponse = await response.json();
  if (jsonResponse.errors) {
    return {
      totalPage: 0,
      flights: [],
    };
  }
  if (typeTrafic === "arrivals") {
    const detailArrival = jsonResponse.result.response.airport.pluginData;
    if (!detailArrival.schedule) return { totalPage: 0, flights: [] };
    return {
      totalPage: detailArrival.schedule.arrivals.page.total,
      flights: mouvementToTrafic(
        detailArrival,
        undefined,
        detailArrival.details
      ),
    };
  } else {
    const detailDeparture = jsonResponse.result.response.airport.pluginData;
    if (!detailDeparture.schedule) return { totalPage: 0, flights: [] };
    return {
      totalPage: detailDeparture.schedule.departures.page.total,
      flights: mouvementToTrafic(
        undefined,
        detailDeparture,
        detailDeparture.details
      ),
    };
  }
}

function mouvementToTrafic(
  detailArrival: IFRArrivalResponse | undefined,
  detailDeparture: IFRDepartureResponse | undefined,
  airport: any
): TrafficInsert[] {
  if (detailArrival) {
    return detailArrival.schedule.arrivals.data.map((item: any) => ({
      departure_date: timeStampToNumber(item.flight.time.scheduled.departure),
      arrival_date: timeStampToNumber(item.flight.time.scheduled.arrival),
      flight_num: item.flight.identification.number.default,
      from_code_airport: item.flight.airport.origin.code.iata,
      from_airport: cleanAirport(item.flight.airport.origin.name),
      to_code_airport: airport.code.iata,
      to_airport: cleanAirport(airport.name),
      sch_arrival_time: timeStampToTime(item.flight.time.scheduled.arrival),
      sch_departure_time: timeStampToTime(item.flight.time.scheduled.departure),
      act_arrival_time: "",
      act_departure_time: "",
      est_arrival_time: "",
      est_departure_time: "",
      flight_status: "Scheduled",
      fr_num:
        item.flight.identification.number.alternative ??
        item.flight.identification.callsign,
      flight_id: 0,
    }));
  } else {
    return detailDeparture!.schedule.departures.data.map((item: any) => ({
      departure_date: timeStampToNumber(item.flight.time.scheduled.departure),
      arrival_date: timeStampToNumber(item.flight.time.scheduled.arrival),
      flight_num: item.flight.identification.number.default,
      from_code_airport: airport.code.iata,
      from_airport: cleanAirport(airport.name),
      to_code_airport: item.flight.airport.destination.code.iata,
      to_airport: cleanAirport(item.flight.airport.destination.name),
      sch_departure_time: timeStampToTime(item.flight.time.scheduled.departure),
      sch_arrival_time: timeStampToTime(item.flight.time.scheduled.arrival),
      act_departure_time: "",
      act_arrival_time: "",
      est_departure_time: "",
      est_arrival_time: "",
      flight_id: 0,
      flight_status: "Scheduled",
      fr_num:
        item.flight.identification.number.alternative ??
        item.flight.identification.callsign,
    }));
  }
}

interface IFRArrivalResponse {
  details: {
    name: string;
    code: {
      iata: string;
      icao: string;
    };
  };
  schedule: {
    arrivals: {
      page: {
        current: number;
        total: number;
      };
      data: {
        flight: {
          identification: {
            number: {
              default: string;
              alternative: string | undefined;
            };
            callsign: string;
          };
          airport: {
            origin: {
              code: {
                iata: string;
                icao: string;
              };
              name: string;
            };
          };
          time: {
            scheduled: {
              departure: number;
              arrival: number;
            };
            real: {
              departure: number;
              arrival: number;
            };
            estimated: {
              departure: number | undefined;
              arrival: number | undefined;
            };
          };
          airline: {
            name: string;
            code: {
              iata: string;
              icao: string;
            };
          };
        };
      }[];
    };
  };
}

interface IFRDepartureResponse {
  details: {
    name: string;
    code: {
      iata: string;
      icao: string;
    };
  };
  schedule: {
    departures: {
      page: {
        current: number;
        total: number;
      };
      data: {
        flight: {
          identification: {
            number: {
              default: "BJ509";
              alternative: null;
            };
            callsign: "LBT509";
          };
          airport: {
            destination: {
              code: {
                iata: "CDG";
                icao: "LFPG";
              };
              name: "Paris Charles de Gaulle Airport";
            };
          };
          time: {
            scheduled: {
              departure: number;
              arrival: number;
            };
            real: {
              departure: number;
              arrival: number;
            };
            estimated: {
              departure: number | undefined;
              arrival: number | undefined;
            };
          };
          airline: {
            name: string;
            code: {
              iata: string;
              icao: string;
            };
          };
        };
      }[];
    };
  };
}
