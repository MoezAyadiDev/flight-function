import {
  getFlightNumfromAirline,
  IFlightAirline,
} from "../repositories/airline.repo";
import { Flight } from "../repositories/flight.repo";
import {
  findTrafficsByDate,
  insertTraffics,
  TrafficInsert,
  TrafficUpdate,
  updateTraffic,
} from "../repositories/traffic.repo";
import { insertUnknownFlight } from "../repositories/unknown_flight.repo";
import { getAeroportTrafic } from "../services/aeroport.service";
import { getTrafficFr } from "../services/fr.service";
import { RequestTraffic } from "../types/request.body";
import { ITrafficFr, TrafficAirport, TrafficItem } from "../types/service.type";
import { onlyUnique } from "../utils/utils";
import { flightEndpoint } from "./flight.endpoint";

export async function trafficEndpoint(traficsSubscribe: RequestTraffic[]) {
  // Traffic not found in FR EZY3120
  // Trrafic not found in Airport EZY3120
  // Traffic not found in FR AH4000
  // Traffic not found in FR AF1184
  // Traffic not found in FR BJ281
  // Traffic not found in FR BJ845
  // Traffic not found in FR TK662
  // Traffic not found in FR BJ130
  // Traffic not found in FR TU374
  // Traffic not found in FR TU756
  // Traffic not found in FR TU756
  // Traffic not found in FR TU790
  // Traffic not found in FR EW383
  // Traffic not found in FR BJ598
  // Traffic not found in FR TU0954
  // Traffic not found in FR BJ598
  // Traffic not found in FR TU0902
  // Traffic not found in FR BJ166
  // Traffic not found in FR TU628
  // Traffic not found in FR BJ130

  const flightNotFound: string[] = [];
  //Get unique airport type traffic
  const traficUnique = traficsSubscribe
    .map<TrafficItem>((item) => ({
      codeAirport: item.airport,
      typeTrafic: item.typeTraffic,
      date: item.flightDate,
      // idCentre: item.idCentre,
    }))
    .filter(onlyUnique);
  const trafficsToInsert: TrafficInsert[] = [];
  for (const uniqueTraficItem of traficUnique) {
    //Get from DB trafic for each date and airport and type
    const traficDB = await findTrafficsByDate(
      uniqueTraficItem.date,
      uniqueTraficItem.codeAirport,
      uniqueTraficItem.typeTrafic
      // uniqueTraficItem.idCentre
    );
    //Filter the trafic to subscribe
    const trafficNotExist = traficsSubscribe.filter(
      (item) =>
        item.airport === uniqueTraficItem.codeAirport &&
        item.flightDate === uniqueTraficItem.date &&
        item.typeTraffic === uniqueTraficItem.typeTrafic &&
        // item.idCentre === uniqueTraficItem.idCentre &&
        traficDB.findIndex(
          (dbItem) =>
            (dbItem.flight_num === item.flightNum ||
              dbItem.local_num.findIndex(
                (locName) => locName === item.flightNum
              ) != -1) &&
            dbItem.id_centre.findIndex((idC) => idC === item.idCentre) != -1
        ) === -1
    );
    if (trafficNotExist.length > 0) {
      //Get traffics from airport
      const traficAirport = await getAeroportTrafic(uniqueTraficItem);
      //Get traffics from fr
      const traficFR = await getTrafficFr(uniqueTraficItem);
      for (const traffic of trafficNotExist) {
        const airlineFlightNum = await getFlightNumfromAirline(
          traffic.flightNum
        );
        const tarfficToInsert = await getTraffic(
          traffic,
          traficAirport,
          traficFR,
          airlineFlightNum
        );

        if (tarfficToInsert) {
          //search the flight by other name
          const indexExist = traficDB.findIndex(
            (item) => item.Flight.id == tarfficToInsert.flight_id
          );
          const indexInsertExist = trafficsToInsert.findIndex(
            (item) => item.flight_id == tarfficToInsert.flight_id
          );
          if (indexExist != -1) {
            const trafficExist = traficDB[indexExist];
            let newFlightNum = undefined;
            let newCentre = undefined;
            if (!trafficExist.local_num.includes(traffic.flightNum)) {
              if (trafficExist.Flight.flight_icao === traffic.flightNum) {
                //Update LocalName
                console.log("FlightNum different");
                newFlightNum = traffic.flightNum;
              }
            }
            if (!trafficExist.id_centre.includes(traffic.idCentre)) {
              console.log("IdCentre different");
              newCentre = traffic.idCentre;
              //Update LocalName
            }
            if (newFlightNum || newCentre) {
              let trafficToUpdate: TrafficUpdate = {};
              if (newFlightNum) {
                trafficToUpdate.local_num = [
                  ...trafficExist.local_num,
                  newFlightNum,
                ];
              }
              if (newCentre) {
                trafficToUpdate.id_centre = [
                  ...trafficExist.id_centre,
                  newCentre,
                ];
              }
              await updateTraffic(trafficExist.id, trafficToUpdate);
            }
          } else if (indexInsertExist != -1) {
            const trafficExist = trafficsToInsert[indexInsertExist];
            if (!trafficExist.local_num.includes(traffic.flightNum)) {
              if (trafficExist.flight_num === tarfficToInsert.flight_num) {
                //Update LocalName
                console.log("FlightNum different");
                trafficsToInsert[indexInsertExist].local_num.push(
                  traffic.flightNum
                );
              }
            }
            if (!trafficExist.id_centre.includes(traffic.idCentre)) {
              console.log("IdCentre different");
              trafficsToInsert[indexInsertExist].id_centre.push(
                traffic.idCentre
              );
              //Update LocalName
            }
          } else {
            // return tarfficToInsert;
            //search the flight in insert by other name
            trafficsToInsert.push(tarfficToInsert);
          }
        } else {
          await insertUnknownFlight({
            airport: traffic.airport,
            date_traffic: traffic.flightDate,
            flight_num: traffic.flightNum,
            type_traffic: traffic.typeTraffic,
          });
          flightNotFound.push(traffic.flightNum);
        }
      }
    }
  }
  if (trafficsToInsert.length > 0) {
    const responseInsertTraffics = await insertTraffics(trafficsToInsert);
    return { Status: responseInsertTraffics };
  }
  if (flightNotFound.length > 0) {
    return {
      Status: true,
      flightNotFound: flightNotFound,
    };
  }
  return { Status: true, message: "All traffic already exist" };
}

async function getTraffic(
  requestTraffic: RequestTraffic,
  traficAirport: TrafficAirport[],
  traficFR: ITrafficFr[],
  flightFromAirline: IFlightAirline
): Promise<TrafficInsert | undefined> {
  const flight = await flightEndpoint(requestTraffic);

  if (!flight) return undefined;
  const flightValues = [
    flight.flight_num,
    flight.flight_icao,
    ...flight.local_name,
  ];

  //get Traffic from airport
  const trafficFromAirport = traficAirport.find(
    (item) =>
      flightValues.includes(item.flightNum) ||
      flightFromAirline.iata === item.flightNum
  );
  //get traffic from fr
  const trafficFromFr = traficFR.find(
    (item) =>
      flightValues.includes(item.flight_num) ||
      flightFromAirline.iata === item.flight_num
  );

  return await mapToTraffic(
    flight,
    trafficFromAirport,
    trafficFromFr,
    requestTraffic
  );
}

async function mapToTraffic(
  flight: Flight,
  trafficAirport: TrafficAirport | undefined,
  trafficFr: ITrafficFr | undefined,
  requestTraffic: RequestTraffic
): Promise<TrafficInsert> {
  if (trafficFr) {
    return {
      flight_num: flight.flight_num,
      fr_num: trafficFr.flight_num,
      departure_date: trafficFr.departure_date,
      arrival_date: trafficFr.arrival_date,
      flight_id: flight.id,
      flight_status: trafficFr.flight_status,
      sch_departure_time: trafficFr.sch_departure_time,
      sch_arrival_time: trafficFr.sch_arrival_time,
      est_departure_time: "",
      est_arrival_time: "",
      act_departure_time: "",
      act_arrival_time: "",
      id_centre: [requestTraffic.idCentre],
      local_num: [requestTraffic.flightNum],
      traffic_airport: requestTraffic.airport,
      traffic_date: requestTraffic.flightDate,
      type_traffic: requestTraffic.typeTraffic,
      traffic_diverted_to: trafficFr.traffic_diverted_to,
    };
  }
  console.log("Traffic not found in FR " + requestTraffic.flightNum);
  if (trafficAirport) {
    return {
      flight_num: flight.flight_num,
      fr_num: flight.flight_icao,
      departure_date: requestTraffic.flightDate,
      arrival_date: requestTraffic.flightDate,
      flight_id: flight.id,
      flight_status: "Scheduled",
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
      id_centre: [requestTraffic.idCentre],
      local_num: [requestTraffic.flightNum],
      traffic_airport: requestTraffic.airport,
      traffic_date: requestTraffic.flightDate,
      traffic_diverted_to: "",
      type_traffic: requestTraffic.typeTraffic,
    };
  }
  console.log("Trrafic not found in Airport " + requestTraffic.flightNum);
  return {
    flight_num: flight.flight_num,
    fr_num: requestTraffic.flightNum,
    departure_date: requestTraffic.flightDate,
    arrival_date: requestTraffic.flightDate,
    flight_id: flight.id,
    flight_status: "Scheduled",
    sch_departure_time: flight.departure_time,
    sch_arrival_time: flight.arrival_time,
    est_departure_time: "",
    est_arrival_time: "",
    act_departure_time: "",
    act_arrival_time: "",
    id_centre: [requestTraffic.idCentre],
    local_num: [requestTraffic.flightNum],
    traffic_airport: requestTraffic.airport,
    traffic_date: requestTraffic.flightDate,
    traffic_diverted_to: "",
    type_traffic: requestTraffic.typeTraffic,
  };
}

// function matTrafficToSubscription(
//   traffic: Traffic,
//   requestTraffic: RequestTraffic
// ): SubscriptionInsert {
//   return {
//     airport: requestTraffic.airport,
//     date_traffic: requestTraffic.flightDate,
//     flight_icao: requestTraffic.flightNum,
//     flight_num: traffic.flight_num,
//     subscription_status: 0,
//     trafic_id: traffic.id,
//     type_traffic: requestTraffic.typeTraffic,
//     id_centre: requestTraffic.idCentre,
//   };
// }

// //Flight info not found BJ640X
