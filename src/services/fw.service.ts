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
      id: undefined,
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
