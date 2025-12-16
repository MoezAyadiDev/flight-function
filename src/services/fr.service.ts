import { FlightStatus, TrafficType } from "../database/supabase";
import { AirlineInsert, IFlightAirline } from "../repositories/airline.repo";
import { AirportInsert } from "../repositories/airport.repo";
import { awaitCall } from "../repositories/api.time.repo";
import { Traffic, TrafficInsert } from "../repositories/traffic.repo";
import { TimeCallFailure } from "../types/failures";
import { IFlightService, ITrafficFr, TrafficItem } from "../types/service.type";
// import {
//   avgTime,
//   chaineToDate,
//   dateToTimeStampMinuit,
//   timeStampToChaine,
//   timeStampToNumber,
//   timeStampToTime,
// } from "../utils/date.util";
import * as DateUtil from "../utils/date.util";
import { encodeQuery } from "../utils/string.util";
import { cleanAirport } from "../utils/utils";

//Http get function
async function httpGet(url: string, headers = {}) {
  const res = await fetch(url, { headers });
  if (!res.ok) console.log(`Failed GET ${url}`);
  return await res.json();
}

//Get all Airline
export async function fetchAirlines(): Promise<AirlineInsert[]> {
  const url = "https://www.flightradar24.com/_json/airlines.php";
  const apiResponse = await httpGet(url);
  return apiResponse.rows.map((item: any) => ({
    airline_name: item.Name,
    code: item.Code,
    icao: item.ICAO,
  }));
}

//Get the list of Airport
export async function fetchAirports(): Promise<AirportInsert[]> {
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
): Promise<IFlightService | undefined> {
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
): Promise<IFlightService | undefined> {
  let searchNum = flightComplet.iata;
  if (!isIata && flightComplet.icao && !flightComplet.alternative) {
    const newFlight = await searchFlight(flightComplet.icao);
    if (!newFlight) return undefined;
    searchNum = newFlight.iata;
  } else if (!isIata && flightComplet.alternative) {
    const newFlight = await searchFlight(flightComplet.alternative);
    if (!newFlight) return undefined;
    searchNum = newFlight.iata;
  } else if (!isIata && flightComplet.icao) {
    const newFlight = await searchFlight(flightComplet.icao);
    if (!newFlight) return undefined;
    searchNum = newFlight.iata;
  }
  const flightSearchResponse = await flightInfoSearch(
    searchNum ?? flightComplet.localName
  );
  if (!flightSearchResponse) {
    return undefined;
  }
  const isDerivited = flightSearchResponse
    .filter((item) => item.status.generic.status.diverted)
    .map((item) => item.status.generic.status.diverted);

  let history = flightSearchResponse.filter((item) => {
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
    defaultTrafic = history[history.length - 1];
  } else {
    defaultTrafic = history[0];
  }
  let times = DateUtil.avgTime(
    history
      .filter((item: any) => item.time.other.duration)
      .map((item: any) => item.time.other.duration)
  );
  if (!times) {
    times = DateUtil.avgTime(
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
    departureTime = DateUtil.timeStampToTime(
      defaultTrafic.time.scheduled.departure
    );
    arrivalTime = DateUtil.timeStampToTime(
      defaultTrafic.time.scheduled.arrival
    );
  } else if (
    defaultTrafic.time.real.departure &&
    defaultTrafic.time.real.arrival
  ) {
    departureTime = DateUtil.timeStampToTime(defaultTrafic.time.real.departure);
    arrivalTime = DateUtil.timeStampToTime(defaultTrafic.time.real.arrival);
  } else {
    return undefined;
  }
  return {
    flight_num: defaultTrafic.identification.number.default,
    flight_icao:
      flightComplet.icao ??
      defaultTrafic.identification.number.alternative ??
      "",
    flight_time: times!.time,
    from_code_airport: defaultTrafic.airport.origin.code.iata,
    to_code_airport: defaultTrafic.airport.destination.code.iata,
    departure_time: departureTime,
    arrival_time: arrivalTime,
    airline: {
      name: defaultTrafic.airline.name,
      iata: defaultTrafic.airline.code.iata,
      icao: defaultTrafic.airline.code.icao,
    },
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
      if (flightNum.substring(0, 2) === "U2") {
        return {
          iata: searchResult.detail.flight,
          icao: searchResult.detail.callsign,
        };
      }
      return undefined;
    }
  } else {
    return undefined;
  }
}

//Fetch Flight Info
async function flightInfoSearch(
  flightNum: string
): Promise<FlightInfoDataFr[]> {
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

export async function getTrafficFr(
  trafficItem: TrafficItem
): Promise<ITrafficFr[]> {
  const maDate = DateUtil.chaineToDateOffset(trafficItem.date.toString());
  let page = 1;
  let pageNext = 1;
  console.log(trafficItem.date, DateUtil.dateDifferenceNow(maDate));
  if (DateUtil.dateDifferenceNow(maDate) > 0) {
    pageNext = -1;
  }

  const detailArrival = await traficCall(
    trafficItem.codeAirport,
    maDate,
    page * pageNext,
    trafficItem.typeTrafic === "Arrival" ? "arrivals" : "departures"
  );

  //https://api.flightradar24.com/common/v1/airport.json?code=tun&plugin[]=&plugin-setting[schedule][mode]=arrivals&plugin-setting[schedule][timestamp]=1765810230&page=-2&limit=100&fleet=&token=
  if (detailArrival.totalPage === 0) {
    return [];
  }
  const totalPage = detailArrival.totalPage;
  let arrivalList: ITrafficFr[] = detailArrival.flights.filter(
    (item: ITrafficFr) =>
      //trafficItem.typeTrafic === "Arrival"
      item.arrival_date === trafficItem.date ||
      item.departure_date === trafficItem.date
  );
  if (totalPage != page * pageNext) {
    for (var i = 1; i <= totalPage; i++) {
      page++;
      const detailArrivalPage = await traficCall(
        trafficItem.codeAirport,
        maDate,
        page * pageNext,
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
): Promise<{ totalPage: number; flights: ITrafficFr[] }> {
  await awaitCall();
  const dateSearch = DateUtil.dateToTimeStampMinuit(DateUtil.dateNow());
  let queryApi = `code=${airport.toLowerCase()}`;
  //queryApi += `&plugin[]=schedule`;
  queryApi += `&plugin[]=`;
  // queryApi += "&plugin-setting[]";
  queryApi += `&plugin-setting[schedule][mode]=${typeTrafic}`;
  queryApi += `&plugin-setting[schedule][timestamp]=${dateSearch}`;
  queryApi += `&limit=100`;
  queryApi += `&page=${page}`;
  const url = `https://api.flightradar24.com/common/v1/airport.json?${queryApi}`;
  console.log(url);
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
      flights: mouvementToTrafic(detailArrival, undefined),
    };
  } else {
    const detailDeparture = jsonResponse.result.response.airport.pluginData;
    if (!detailDeparture.schedule) return { totalPage: 0, flights: [] };
    return {
      totalPage: detailDeparture.schedule.departures.page.total,
      flights: mouvementToTrafic(undefined, detailDeparture),
    };
  }
}

function mouvementToTrafic(
  detailArrival: IFRArrivalResponse | undefined,
  detailDeparture: IFRDepartureResponse | undefined
): ITrafficFr[] {
  if (detailArrival) {
    return detailArrival.schedule.arrivals.data.map((item: any) => {
      let flightStatus: FlightStatus = "Scheduled";
      const estArrivalTime = item.flight.time.estimated.arrival;
      const actArrivalTime = item.flight.time.real.arrival;
      const actDepartureTime = item.flight.time.real.departure;
      if (estArrivalTime) {
        if (DateUtil.timeStampNow() > estArrivalTime) {
          flightStatus = "Landed";
        }
      }
      if (actDepartureTime) {
        if (flightStatus != "Landed") {
          flightStatus = "onAir";
        }
      }
      if (actArrivalTime) {
        flightStatus = "Landed";
      }
      if (item.flight.status.text.includes("Canceled")) {
        flightStatus = "Canceled";
      }
      return {
        flight_num: item.flight.identification.number.default,
        type_traffic: "Arrival",
        departure_date: DateUtil.timeStampToNumber(
          item.flight.time.scheduled.departure
        ),
        arrival_date: DateUtil.timeStampToNumber(
          item.flight.time.scheduled.arrival
        ),
        traffic_diverted_to: "",
        sch_arrival_time: DateUtil.timeStampToTime(
          item.flight.time.scheduled.arrival
        ),
        sch_departure_time: DateUtil.timeStampToTime(
          item.flight.time.scheduled.departure
        ),
        act_arrival_time: actArrivalTime
          ? DateUtil.timeStampToTime(actArrivalTime)
          : "",
        act_departure_time: actDepartureTime
          ? DateUtil.timeStampToTime(actDepartureTime)
          : "",
        est_arrival_time: estArrivalTime
          ? DateUtil.timeStampToTime(estArrivalTime)
          : "",
        est_departure_time: item.flight.time.estimated.departure
          ? DateUtil.timeStampToTime(item.flight.time.estimated.departure)
          : "",
        flight_status: flightStatus,
      };
    });
  } else {
    return detailDeparture!.schedule.departures.data.map((item: any) => {
      let flightStatus: FlightStatus = "Scheduled";
      const estArrivalTime = item.flight.time.estimated.arrival;
      const actArrivalTime = item.flight.time.real.arrival;
      const actDepartureTime = item.flight.time.real.departure;
      if (estArrivalTime) {
        if (DateUtil.timeStampNow() > estArrivalTime) {
          flightStatus = "Landed";
        }
      }
      if (actDepartureTime) {
        if (flightStatus != "Landed") {
          flightStatus = "onAir";
        }
      }
      if (actArrivalTime) {
        flightStatus = "Landed";
      }
      if (item.flight.status.text.includes("Canceled")) {
        flightStatus = "Canceled";
      }
      return {
        flight_num: item.flight.identification.number.default,
        type_traffic: "Departure",
        departure_date: DateUtil.timeStampToNumber(
          item.flight.time.scheduled.departure
        ),
        arrival_date: DateUtil.timeStampToNumber(
          item.flight.time.scheduled.arrival
        ),
        traffic_diverted_to: "",
        sch_departure_time: DateUtil.timeStampToTime(
          item.flight.time.scheduled.departure
        ),
        sch_arrival_time: DateUtil.timeStampToTime(
          item.flight.time.scheduled.arrival
        ),
        act_arrival_time: actArrivalTime
          ? DateUtil.timeStampToTime(actArrivalTime)
          : "",
        act_departure_time: actDepartureTime
          ? DateUtil.timeStampToTime(actDepartureTime)
          : "",
        est_arrival_time: estArrivalTime
          ? DateUtil.timeStampToTime(estArrivalTime)
          : "",
        est_departure_time: item.flight.time.estimated.departure
          ? DateUtil.timeStampToTime(item.flight.time.estimated.departure)
          : "",
        flight_status: flightStatus,
      };
    });
  }
}

export async function trackFlightFr(traffic: Traffic) {
  const jsonResponse = await getFlightTrack(traffic.fr_num);
  if (!jsonResponse.result.response.data) return undefined;
  const flightFound = jsonResponse.result.response.data.find(
    (item: any) =>
      DateUtil.timeStampToChaine(item.time.scheduled.departure) ===
      traffic.departure_date.toString()
  );
  if (!flightFound) return undefined;

  return {
    sch_departure_time: DateUtil.timeStampToTime(
      flightFound.time.scheduled.departure
    ),
    sch_arrival_time: DateUtil.timeStampToTime(
      flightFound.time.scheduled.arrival
    ),
    act_departure_time: flightFound.time.real.departure
      ? DateUtil.timeStampToTime(flightFound.time.real.departure)
      : "",
    act_arrival_time: flightFound.time.real.arrival
      ? DateUtil.timeStampToTime(flightFound.time.real.arrival)
      : "",
    est_departure_time: flightFound.time.estimated.departure
      ? DateUtil.timeStampToTime(flightFound.time.estimated.departure)
      : "",
    est_arrival_time: flightFound.time.estimated.arrival
      ? DateUtil.timeStampToTime(flightFound.time.estimated.arrival)
      : "",
    id: flightFound.identification.id,
  };
}

async function getFlightTrack(flightNum: string) {
  await awaitCall();
  let page = 1;
  let queryApi = `fetchBy=flight`;
  queryApi += `&page=${page}`;
  queryApi += `&limit=25`;
  queryApi += `&query=${flightNum}`;
  const url = `https://api.flightradar24.com/common/v1/flight/list.json?${queryApi}`;
  const apiResponse = await httpGet(url);
  return apiResponse;
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
interface FlightInfoDataFr {
  identification: {
    number: { default: string; alternative: string | null };
    callsign: string | undefined;
    codeshare: string | undefined;
  };
  status: {
    live: boolean;
    text: string; //"Scheduled";
    estimated: null;
    ambiguous: false;
    generic: {
      status: {
        text: string;
        diverted: any;
      };
      eventTime: { utc: null; local: null };
    };
  };
  airline: { name: string; code: { iata: string; icao: string } };
  airport: {
    origin: AirportFr;
    destination: AirportFr;
  };
  time: {
    scheduled: TimeFr;
    real: TimeFr;
    estimated: TimeFr;
    other: { eta: null; updated: 1765586134; duration: null };
  };
}

interface FlightInfoFr {
  result: {
    response: {
      item: { current: number; total: number | undefined; limit: number };
      page: { current: number; more: boolean; total: number | undefined };
      data: [FlightInfoDataFr[]];
    };
  };
}

interface AirportFr {
  name: string;
  code: { iata: string; icao: string };
}

interface TimeFr {
  departure: number | undefined;
  arrival: number | undefined;
}

// code=nbe&    [mode]=arrivals&    [timestamp]=1765843200&   limit=100   &page=1
// code=nbe&    [mode]=departures&    [timestamp]=1765843200&   limit=100   &page=1

// code=tun&    [mode]=arrivals&    [timestamp]=1765843200&   limit=100   &page=1
// code=tun&    [mode]=arrivals&    [timestamp]=1765843200&   limit=100   &page=2
// code=tun&    [mode]=arrivals&    [timestamp]=1765843200&   limit=100   &page=3
// code=tun&    [mode]=departures&    [timestamp]=1765843200&   limit=100   &page=1
// code=tun&    [mode]=departures&    [timestamp]=1765843200&   limit=100   &page=2
// code=tun&    [mode]=departures&    [timestamp]=1765843200&   limit=100   &page=3

// code=mir&    [mode]=arrivals&    [timestamp]=1765843200&   limit=100   &page=1
// code=mir&    [mode]=departures&    [timestamp]=1765843200&   limit=100   &page=1

// code=dje&    [mode]=departures&    [timestamp]=1765843200&   limit=100   &page=1
// code=dje&    [mode]=arrivals&    [timestamp]=1765843200&   limit=100   &page=1
