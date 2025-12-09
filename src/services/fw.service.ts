import { IFlightAirline } from "../repositories/airline.repo";
import { FlightInsert } from "../repositories/flight.repo";
import {
  dateNow,
  durationToChaine,
  timeStampDifferenceMinute,
  timeStampToTime,
} from "../utils/date.util";

export default async function fetchFlightInfoFw(
  airlineFlightNum: IFlightAirline
): Promise<FlightInsert | undefined> {
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

    const contents = myJson["flights"][firstKey];
    const activityLog = contents["activityLog"];
    if (!activityLog) {
      return undefined;
    }

    const historyFlightAll = contents["activityLog"]["flights"]
      .filter(
        (item: any) =>
          item["origin"]["isValidAirportCode"] &&
          item["destination"]["isValidAirportCode"] &&
          item["takeoffTimes"]["scheduled"] &&
          item["landingTimes"]["scheduled"]
      )
      .map((item: any) => ({
        origin: item["origin"]["iata"],
        originAirport: item["origin"]["friendlyName"],
        destination: item["destination"]["iata"],
        destinationAirport: item["destination"]["friendlyName"],
        departTime: item["takeoffTimes"]["scheduled"],
        arrivalTime: item["landingTimes"]["scheduled"],
        realDeparture: item["takeoffTimes"]["actual"],
        realArrival: item["landingTimes"]["actual"],
        flightNum: item["displayIdent"],
      }));
    if (historyFlightAll.length === 0) {
      return flightWithoutHistory(contents, airlineFlightNum.localName);
      return undefined;
    }
    const getPastFlight = historyFlightAll.filter(
      (item: any) => item.departTime * 1000 < dateNow().getTime()
    );
    const refrenceFlight =
      getPastFlight.length != 0 ? getPastFlight[0] : historyFlightAll[0];
    const fltTime = flightTime(historyFlightAll);
    const duration =
      Number(fltTime.split(":")[0]) * 60 * 60 +
      Number(fltTime.split(":")[1]) * 60;
    return {
      flight_num: airlineFlightNum.iata ?? "",
      flight_icao: airlineFlightNum.icao ?? "",
      flight_time: fltTime,
      from_code_airport: refrenceFlight.origin,
      from_airport: refrenceFlight.originAirport,
      to_code_airport: refrenceFlight.destination,
      to_airport: refrenceFlight.destinationAirport,
      departure_time: timeStampToTime(refrenceFlight.departTime),
      arrival_time: timeStampToTime(refrenceFlight.arrivalTime),
      airline: airlineFlightNum.airline ?? "",
      local_name: airlineFlightNum.localName,
      duration: duration,
    };
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

// {
//   activityLog: { flights: [], additionalLogRowsAvailable: false },
//   adhoc: false,
//   adhocAvailable: false,
//   aircraft: {
//     type: 'A320',
//   },
//   aireonCandidate: false,
//   airline: {
//     shortName: 'easyJet',
//   },
//   altitude: null,
//   altitudeChange: null,
//   atcIdent: null,
//   averageDelays: null,
//   blocked: false,
//   blockedForUser: false,
//   blockMessage: null,
//   cabinInfo: { text: null, links: null },
//   cancelled: false,
//   cockpitInformation: null,
//   codeShare: {
//     ident: 'EZY6331',
//     displayIdent: 'EZY6331',
//     iataIdent: 'U26331',
//     airline: {
//       fullName: 'EasyJet Airline Co. Ltd.',
//       shortName: 'easyJet',
//       icao: 'EZY',
//       iata: 'U2',
//       callsign: 'Easy',
//       url: 'http://www.easyjet.com/'
//     },
//     friendlyIdent: 'easyJet 6331',
//     thumbnail: {
//       imageUrl: 'https://www.flightaware.com/images/airline_logos/180px/EZY.png',
//       linkUrl: '/live/fleet/EZY'
//     },
//     links: {
//     }
//   },
//   coord: null,
//   destination: {
//     altIdent: 'NBE',
//     iata: 'NBE',
//     friendlyName: 'Enfidha-Hammamet International Airport ',
//     friendlyLocation: 'Enfidha, Tunisia',
//   },
//   displayIdent: 'EZY6331',
//   distance: { elapsed: 1015, remaining: 0, actual: 1075 },
//   diverted: false,
//   encryptedFlightId: 'b94cdc6a0240027f0259f9e96e6e8ac5de8bc528ef65897cc977688893ca90bd3015903c2262e3c9',
//   flightId: 'EZY6331-1743064613-airline-519p:0',
//   flightPlan: {
//     speed: 393,
//     altitude: null,
//     route: '',
//     directDistance: 1015,
//     plannedDistance: null,
//     departure: 1743265500,
//     ete: 8700,
//     fuelBurn: { gallons: 2500, pounds: 17000 }
//   },
//   flightStatus: 'arrived',
//   fpasAvailable: false,
//   friendlyIdent: 'easyJet 6331',
//   fruOverride: false,
//   ga: false,
//   gateArrivalTimes: { scheduled: 1743275400, estimated: 1743275280, actual: 1743275520 },
//   gateDepartureTimes: { scheduled: 1743264900, estimated: 1743265320, actual: 1743265800 },
//   globalCandidate: false,
//   globalIdent: false,
//   globalFlightFeatures: false,
//   globalLegSharing: false,
//   globalServices: {},
//   globalVisualizer: false,
//   groundspeed: null,
//   heading: null,
//   hexid: null,
//   historical: true,
//   iataIdent: 'U26331',
//   icon: 'airliner',
//   ident: 'EZY6331',
//   inboundFlight: null,
//   internal: null,
//   interregional: true,
//   landingTimes: { scheduled: 1743274200, estimated: 1743274920, actual: 1743274920 },
//   links: {
//     operated: '/live/flight/EZY6331/history/20250329/1625Z/EGKK/DTNH',
//     registration: '/live/flight//history/20250329/1625Z/EGKK/DTNH',
//     permanent: '/live/flight/EZY6331/history/20250329/1625Z/EGKK/DTNH',
//     trackLog: '/live/flight/EZY6331/history/20250329/1625Z/EGKK/DTNH/tracklog',
//     flightHistory: '/live/flight/EZY6331/history',
//     buyFlightHistory: '/live/flight/EZY6331/history/buy',
//     reportInaccuracies: '/live/report/EZY6331/history/20250329/1625Z/EGKK/DTNH',
//     facebook: 'https://facebook.com/sharer.php?u=https://fr.flightaware.com/live/flight/EZY6331/history/20250329/1625Z/EGKK/DTNH',
//     twitter: 'https://twitter.com/intent/tweet?url=https://fr.flightaware.com/live/flight/EZY6331/history/20250329/1625Z/EGKK/DTNH&via=FlightAware'
//   },
//   myAlerts: {
//     editAlert: '',
//     advancedAlert: '/account/manage/alerts/0/add?m_ident=EZY6331;date_start=2025-03-29;date_end=2025-03-29'
//   },
//   myFlightAware: null,
//   origin: {
//     TZ: ':Europe/London',
//     isValidAirportCode: true,
//     isCustomGlobalAirport: false,
//     altIdent: 'LGW',
//     iata: 'LGW',
//     friendlyName: 'London Gatwick',
//     friendlyLocation: 'London, United Kingdom',
//     coord: [ -0.1903, 51.1481 ],
//     isLatLon: false,
//     icao: 'EGKK',
//     gate: '5',
//     terminal: 'S',
//     delays: null
//   },
//   poweredOff: null,
//   poweredOn: null,
//   predictedAvailable: false,
//   predictedTimes: { out: null, off: null, on: null, in: null },
//   redactedBlockedTail: null,
//   redactedCallsign: true,
//   redactedTail: true,
//   relatedThumbnails: [],
//   remarks: null,
//   resultUnknown: false,
//   roundedTimestamp: 1743276120,
//   runways: { origin: null, destination: null },
//   speedInformation: null,
//   showSurfaceTimes: false,
//   surfaceTrackAvailable: null,
//   takeoffTimes: { scheduled: 1743265500, estimated: 1743266400, actual: 1743266400 },
//   taxiIn: null,
//   taxiOut: null,
//   thumbnail: {
//     imageUrl: 'https://www.flightaware.com/images/airline_logos/180px/EZY.png',
//     linkUrl: '/live/fleet/EZY'
//   },
//   timestamp: 1743276136,
//   track: [],
//   updateType: '',
//   usingShareUrl: false,
//   waypoints: [],
//   weather: null
// }
