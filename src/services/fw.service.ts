import { IFlightAirline } from "../repositories/airline.repo";
import { IFlightService } from "../types/service.type";
import {
  dateNow,
  durationToChaine,
  timeStampDifferenceMinute,
  timeStampToTime,
} from "../utils/date.util";

export default async function fetchFlightInfoFw(
  airlineFlightNum: IFlightAirline
): Promise<IFlightService | undefined> {
  try {
    const response = await fetch(
      `https://fr.flightaware.com/live/flight/${
        airlineFlightNum.icao ?? airlineFlightNum.localName
      }`
    );

    const flatText = await response.text();

    const index = flatText.indexOf("trackpollBootstrap");
    const indexclose = flatText.indexOf("</script>", index);
    const indexOpen = flatText.indexOf("{", index);

    const myJson = JSON.parse(flatText.substring(indexOpen, indexclose - 1));

    const firstKey = Object.keys(myJson["flights"])[0];

    const contents: FlightInfoFw = myJson["flights"][firstKey];

    if (!contents) return undefined;

    const duration =
      contents.landingTimes.scheduled - contents.takeoffTimes.scheduled;
    return {
      flight_num: contents.codeShare.iataIdent,
      flight_icao: contents.codeShare.ident ?? contents.codeShare.displayIdent,
      from_code_airport: contents.origin.iata,
      to_code_airport: contents.destination.iata,
      departure_time: timeStampToTime(contents.takeoffTimes.scheduled),
      arrival_time: timeStampToTime(contents.landingTimes.scheduled),
      airline: {
        name: contents.airline.shortName,
        iata: contents.airline.iata,
        icao: contents.airline.icao,
      },
      flight_time: durationToChaine(duration),
      duration: duration,
    };

    // const activityLog = contents["activityLog"];
    // if (!activityLog) {
    //   return undefined;
    // }
    // contents.track = undefined;
    // console.log(contents);

    // const historyFlightAll = contents["activityLog"]["flights"]
    //   .filter(
    //     (item: any) =>
    //       item["origin"]["isValidAirportCode"] &&
    //       item["destination"]["isValidAirportCode"] &&
    //       item["takeoffTimes"]["scheduled"] &&
    //       item["landingTimes"]["scheduled"]
    //   )
    //   .map((item: any) => ({
    //     origin: item["origin"]["iata"],
    //     originAirport: item["origin"]["friendlyName"],
    //     destination: item["destination"]["iata"],
    //     destinationAirport: item["destination"]["friendlyName"],
    //     departTime: item["takeoffTimes"]["scheduled"],
    //     arrivalTime: item["landingTimes"]["scheduled"],
    //     realDeparture: item["takeoffTimes"]["actual"],
    //     realArrival: item["landingTimes"]["actual"],
    //     flightNum: item["displayIdent"],
    //   }));
    // if (historyFlightAll.length === 0) {
    //   return flightWithoutHistory(contents, airlineFlightNum.localName);
    //   return undefined;
    // }
    // const getPastFlight = historyFlightAll.filter(
    //   (item: any) => item.departTime * 1000 < dateNow().getTime()
    // );
    // const refrenceFlight =
    //   getPastFlight.length != 0 ? getPastFlight[0] : historyFlightAll[0];
    // const fltTime = flightTime(historyFlightAll);
    // const duration =
    //   Number(fltTime.split(":")[0]) * 60 * 60 +
    //   Number(fltTime.split(":")[1]) * 60;
    // return {
    //   flight_num: airlineFlightNum.iata ?? "",
    //   flight_icao: airlineFlightNum.icao ?? "",
    //   flight_time: fltTime,
    //   from_code_airport: refrenceFlight.origin,
    //   to_code_airport: refrenceFlight.destination,
    //   departure_time: timeStampToTime(refrenceFlight.departTime),
    //   arrival_time: timeStampToTime(refrenceFlight.arrivalTime),
    //   airline: { name: airlineFlightNum.airline ?? "", iata: "", icao: "" },
    //   duration: duration,
    // };
  } catch (ex) {
    console.error(`ERROR: ${ex}`);
    return undefined;
  }
}

function flightTime(flightRoutes: any) {
  const flightTarficsAct = flightRoutes.filter(
    (item: any) =>
      item.realArrival &&
      item.realDeparture &&
      item.realArrival != item.realDeparture
  );
  const flightTarfics =
    flightTarficsAct.length != 0
      ? flightTarficsAct.map(
          (item: any) => item.realArrival - item.realDeparture
        )
      : flightRoutes.map((item: any) =>
          timeStampDifferenceMinute(item.departTime, item.arrivalTime)
        );
  if (flightTarfics.length === 0) return "";
  var sum = 0;
  for (var i = 0; i < flightTarfics.length; i++) {
    sum += flightTarfics[i];
  }

  var avg = Math.round(sum / flightTarfics.length);

  // const finalHour = Math.floor(avg / 60 / 60);

  return durationToChaine(avg);
}

function flightWithoutHistory(contents: any, flightName: string) {
  contents.relatedThumbnails = [];
  contents.track = [];

  const takeoffTimes = contents["takeoffTimes"]["scheduled"];
  const landingTimes = contents["landingTimes"]["scheduled"];
  const flightTime = durationToChaine(
    timeStampDifferenceMinute(takeoffTimes, landingTimes)
  );
  const duration =
    Number(flightTime.split(":")[0]) * 60 * 60 +
    Number(flightTime.split(":")[1]) * 60;
  return {
    flight_num: contents.codeShare.iataIdent ?? "",
    flight_icao: contents.codeShare.ident ?? "",
    flight_time: flightTime,
    from_code_airport: contents.origin.iata,
    from_airport: contents.origin.friendlyName,
    to_code_airport: contents.destination.iata,
    to_airport: contents.destination.friendlyName,
    departure_time: timeStampToTime(takeoffTimes),
    arrival_time: timeStampToTime(landingTimes),
    airline: contents.airline.shortName ?? "",
    local_name: flightName,
    duration: duration,
  };
}

interface FlightInfoFw {
  codeShare: {
    ident: string;
    displayIdent: string;
    iataIdent: string;
  };
  landingTimes: {
    scheduled: number;
    estimated: number;
    actual: number;
  };
  takeoffTimes: {
    scheduled: number;
    estimated: number;
    actual: number;
  };
  origin: {
    iata: string;
  };
  destination: {
    iata: string;
  };
  airline: {
    shortName: string;
    icao: string;
    iata: string;
  };
}

// const res = {
//   activityLog: {
//     flights: [[Object]],
//     additionalLogRowsAvailable: false,
//   },
//   adhoc: false,
//   adhocAvailable: false,
//   aireonCandidate: false,
//   airline: {
//     fullName: "Tunis Air - Societe Tunisienne de L'air",
//     shortName: "Tunisair",
//     icao: "TAR",
//     iata: "TU",
//   },
//   altitude: null,
//   altitudeChange: null,
//   atcIdent: null,
//   averageDelays: { departure: 2735, arrival: 2691 },
//   blocked: false,
//   blockedForUser: false,
//   blockMessage: null,
//   cabinInfo: { text: null, links: null },
//   cancelled: false,
//   cockpitInformation: null,
//   codeShare: {
//     ident: "TAR955",
//     displayIdent: "TAR955",
//     iataIdent: "TU955",
//   },
//   coord: null,
//   destination: {
//     iata: "TUN",
//   },
//   displayIdent: "TAR955",
//   distance: { elapsed: 879, remaining: 1, actual: 902 },
//   diverted: false,
//   flightStatus: "arrived",
//   fpasAvailable: false,
//   friendlyIdent: "Tunisair 955",
//   fruOverride: false,
//   ga: false,
//   gateArrivalTimes: {
//     scheduled: 1765631100,
//     estimated: 1765636200,
//     actual: null,
//   },
//   gateDepartureTimes: {
//     scheduled: 1765621500,
//     estimated: 1765626120,
//     actual: null,
//   },
//   globalCandidate: false,
//   globalIdent: false,
//   globalFlightFeatures: false,
//   globalLegSharing: false,
//   globalServices: {},
//   globalVisualizer: false,
//   groundspeed: null,
//   heading: null,
//   hexid: null,
//   historical: false,
//   iataIdent: "TU955",
//   icon: "airliner",
//   ident: "TAR955",
//   inboundFlight: {
//     flightId: "TAR954-1765443163-airline-1282p:0",
//     linkUrl: "/live/flight/id/TAR954-1765443163-airline-1282p%3a0",
//   },
//   internal: null,
//   interregional: true,
//   landingTimes: {
//     scheduled: 1765630500,
//     estimated: 1765635540,
//     actual: 1765635540,
//   },
//   myFlightAware: null,
//   origin: {
//     iata: "BRU",
//   },
//   poweredOff: null,
//   poweredOn: null,
//   predictedAvailable: false,
//   predictedTimes: { out: null, off: null, on: null, in: null },
//   redactedBlockedTail: null,
//   redactedCallsign: null,
//   redactedTail: true,
//   remarks: null,
//   resultUnknown: false,
//   roundedTimestamp: 1765635660,
//   runways: { origin: null, destination: null },
//   speedInformation: null,
//   showSurfaceTimes: false,
//   surfaceTrackAvailable: null,
//   takeoffTimes: {
//     scheduled: 1765622100,
//     estimated: 1765627920,
//     actual: 1765627920,
//   },
//   taxiIn: null,
//   taxiOut: null,
//   timestamp: 1765635683,
//   track: undefined,
//   updateType: "",
//   usingShareUrl: false,
//   waypoints: [],
//   weather: null,
// };
