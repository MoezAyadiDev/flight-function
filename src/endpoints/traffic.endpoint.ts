import { Flight } from "../repositories/flight.repo";
import {
  findSubscriptionsByDate,
  insertSubscriptions,
  SubscriptionInsert,
} from "../repositories/subscription.repo";
import {
  insertTraffics,
  Traffic,
  TrafficInsert,
} from "../repositories/traffic.repo";
import { getAeroportTrafic } from "../services/aeroport.service";
import { getTrafficFr } from "../services/fr.service";
import { InsertFailure } from "../types/failures";
import { RequestTraffic } from "../types/request.body";
import { TrafficAirport, TrafficItem } from "../types/service.type";
import { onlyUnique } from "../utils/utils";
import { flightEndpoint } from "./flight.endpoint";

export async function trafficEndpoint(traficsSubscribe: RequestTraffic[]) {
  //Get unique airport type traffic
  const traficUnique = traficsSubscribe
    .map<TrafficItem>((item) => ({
      codeAirport: item.airport,
      typeTrafic: item.typeTraffic,
      date: item.flightDate,
    }))
    .filter(onlyUnique);
  const trafficsToInsert: TrafficInsert[] = [];
  for (const uniqueTraficItem of traficUnique) {
    //Get from DB trafic for each date and airport and type
    const traficDB = await findSubscriptionsByDate(
      uniqueTraficItem.date,
      uniqueTraficItem.codeAirport,
      uniqueTraficItem.typeTrafic
    );

    //Filter the trafic to subscribe
    const trafficNotExist = traficsSubscribe.filter(
      (item) =>
        item.airport === uniqueTraficItem.codeAirport &&
        item.flightDate === uniqueTraficItem.date &&
        item.typeTraffic === uniqueTraficItem.typeTrafic &&
        traficDB.findIndex(
          (dbItem) =>
            dbItem.flight_num === item.flightNum ||
            dbItem.flight_icao === item.flightNum
        ) === -1
    );
    if (trafficNotExist.length > 0) {
      //Get traffics from airport
      const traficAirport = await getAeroportTrafic(uniqueTraficItem);
      //Get traffics from fr
      const traficFR = await getTrafficFr(uniqueTraficItem);
      for (const traffic of trafficNotExist) {
        const tarfficToInsert = await getTraffic(
          traffic,
          traficAirport,
          traficFR
        );
        trafficsToInsert.push(tarfficToInsert);
      }
    }
  }
  if (trafficsToInsert.length > 0) {
    const traffics = await insertTraffics(trafficsToInsert);
    if (traffics.length === 0) throw new InsertFailure("Tarffics");
    const subsToInsert: SubscriptionInsert[] = [];
    for (const item of traffics) {
      const requestTraff = traficsSubscribe.find(
        (sub) => sub.flightNum === item.flight_num
      );
      if (requestTraff) {
        subsToInsert.push(matTrafficToSubscription(item, requestTraff));
      } else {
        console.log("Subscription fail to identify " + item.flight_num);
      }
    }
    if (subsToInsert.length > 0) {
      const responseSubInsert = await insertSubscriptions(subsToInsert);
      return { Status: responseSubInsert };
    } else {
      throw new InsertFailure("Subscriptons");
    }
  }
  return { Status: true, message: "All traffic already exist" };
  //   Flight info not found EZY6331
  // ERROR: TypeError: history.last is not a function
}

async function getTraffic(
  requestTraffic: RequestTraffic,
  traficAirport: TrafficAirport[],
  traficFR: TrafficInsert[]
): Promise<TrafficInsert> {
  const flight = await flightEndpoint(requestTraffic);
  const flightValues = [
    flight.flight_num,
    flight.flight_icao,
    flight.local_name,
  ];

  //get Traffic from airport
  const trafficFromAirport = traficAirport.find((item) =>
    flightValues.includes(item.flightNum)
  );
  //get traffic from fr
  const trafficFromFr = traficFR.find(
    (item) =>
      flightValues.includes(item.flight_num) ||
      flightValues.includes(item.fr_num)
  );
  return mapToTraffic(
    flight,
    trafficFromAirport,
    trafficFromFr,
    requestTraffic
  );
}

function mapToTraffic(
  flight: Flight,
  trafficAirport: TrafficAirport | undefined,
  trafficFr: TrafficInsert | undefined,
  requestTraffic: RequestTraffic
): TrafficInsert {
  if (trafficFr) {
    return {
      flight_num: requestTraffic.flightNum,
      fr_num: trafficFr.flight_num,
      departure_date: trafficFr.departure_date,
      arrival_date: trafficFr.arrival_date,
      flight_id: flight.id,
      flight_status: "Scheduled",
      from_code_airport: trafficFr.from_code_airport,
      from_airport: trafficFr.from_airport,
      to_code_airport: trafficFr.to_code_airport,
      to_airport: trafficFr.to_airport,
      sch_departure_time: trafficFr.sch_departure_time,
      sch_arrival_time: trafficFr.sch_arrival_time,
      est_departure_time: "",
      est_arrival_time: "",
      act_departure_time: "",
      act_arrival_time: "",
    };
  }
  if (trafficAirport) {
    return {
      flight_num: requestTraffic.flightNum,
      fr_num: trafficAirport.flightNum,
      departure_date: requestTraffic.flightDate,
      arrival_date: requestTraffic.flightDate,
      flight_id: flight.id,
      flight_status: "Scheduled",
      from_code_airport:
        trafficAirport.formCodeAirport != ""
          ? trafficAirport.formCodeAirport
          : flight.from_code_airport,
      from_airport: trafficAirport.fromAirport,
      to_code_airport:
        trafficAirport.toCodeAirport != ""
          ? trafficAirport.toCodeAirport
          : flight.to_code_airport,
      to_airport: trafficAirport.toAirport,
      sch_departure_time:
        trafficAirport.typeTrafic === "Arrival"
          ? flight.departure_time
          : trafficAirport.heure,
      sch_arrival_time:
        trafficAirport.typeTrafic === "Arrival"
          ? trafficAirport.heure
          : flight.departure_time,
      est_departure_time: "",
      est_arrival_time: "",
      act_departure_time: "",
      act_arrival_time: "",
    };
  }
  return {
    flight_num: requestTraffic.flightNum,
    fr_num: flight.local_name,
    departure_date: requestTraffic.flightDate,
    arrival_date: requestTraffic.flightDate,
    flight_id: flight.id,
    flight_status: "Scheduled",
    from_code_airport: flight.from_code_airport,
    from_airport: flight.from_airport,
    to_code_airport: flight.to_code_airport,
    to_airport: flight.to_airport,
    sch_departure_time: flight.departure_time,
    sch_arrival_time: flight.arrival_time,
    est_departure_time: "",
    est_arrival_time: "",
    act_departure_time: "",
    act_arrival_time: "",
  };
}

function matTrafficToSubscription(
  traffic: Traffic,
  requestTraffic: RequestTraffic
): SubscriptionInsert {
  return {
    airport: requestTraffic.airport,
    date_traffic: requestTraffic.flightDate,
    flight_icao: traffic.fr_num,
    flight_num: requestTraffic.flightNum,
    subscription_status: 0,
    trafic_id: traffic.id,
    type_traffic: requestTraffic.typeTraffic,
  };
}
