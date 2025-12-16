import { Flight } from "../repositories/flight.repo";
import {
  findObservationsByIdTraffic,
  insertObservations,
  ObservationInsert,
} from "../repositories/observation.repo";

import {
  getTrafficsActif,
  Traffic,
  TrafficWithFlight,
  updateTraffic,
} from "../repositories/traffic.repo";
import { getAeroportTrack } from "../services/aeroport.service";
import { getTrafficFr, trackFlightFr } from "../services/fr.service";
import mailService from "../services/mailing.service";
import { TrafficItem } from "../types/service.type";
import {
  chaineToDate,
  dateDifferenceNow,
  timeCompareNow,
} from "../utils/date.util";
import { onlyUnique } from "../utils/utils";

export async function trackEndpoint() {
  const traficsSubscribe = await getTrafficsActif();
  //Get unique airport type traffic
  const traficUnique = traficsSubscribe
    .map<TrafficItem>((item) => ({
      codeAirport: item.traffic_airport,
      typeTrafic: item.type_traffic,
      date: item.traffic_date,
    }))
    .filter(onlyUnique);
  const observationInsert: ObservationInsert[] = [];
  for (const uniqueTraficItem of traficUnique) {
    //Select traffic subscription
    const subsTraffics = traficsSubscribe.filter(
      (item) =>
        item.traffic_airport === uniqueTraficItem.codeAirport &&
        item.type_traffic === uniqueTraficItem.typeTrafic &&
        item.traffic_date === uniqueTraficItem.date
    );
    //Get traffics from airport and fr
    const [traficAirport, traficFR] = await Promise.all([
      getAeroportTrack(uniqueTraficItem),
      getTrafficFr(uniqueTraficItem),
    ]);
    // console.log(traficAirport);

    for (const subsTraffic of subsTraffics) {
      const allFlightNum = getAllFlightNum(subsTraffic.Flight);
      let flightFR = traficFR.find(
        (item) =>
          allFlightNum.includes(item.flight_num) &&
          (uniqueTraficItem.typeTrafic === "Departure"
            ? item.departure_date === uniqueTraficItem.date
            : item.arrival_date === uniqueTraficItem.date)
      );

      const flightAirport = traficAirport.find((item) =>
        allFlightNum.includes(item.flightNum)
      );
      const comments = await findObservationsByIdTraffic(subsTraffic.id);
      let realTime = {
        time: {
          real: { arrival: "", departure: "" },
          estimated: { arrival: "", departure: "" },
        },
        comment: "",
      };
      let flightStatus = "Scheduled";
      if (flightAirport) {
        const observationAirport = comments.find(
          (item) =>
            item.provenance === "Airport" &&
            item.observation === flightAirport.comment
        );
        if (!observationAirport) {
          observationInsert.push({
            observation: flightAirport.comment,
            provenance: "Airport",
            trafic_id: subsTraffic.id,
          });
        }
        realTime.time.estimated.arrival =
          flightAirport.time.estimated.arrival ?? "";
        realTime.time.estimated.departure =
          flightAirport.time.estimated.departure ?? "";
        realTime.time.real.arrival = flightAirport.time.real.arrival ?? "";
        realTime.time.real.departure = flightAirport.time.real.departure ?? "";
        if (flightAirport.time.real.departure) {
          flightStatus = "onAir";
        }
        if (flightAirport.time.real.arrival) {
          flightStatus = "Landed";
        }
      }

      if (!flightFR) {
        const trackFlightFromFr = await trackFlightFr(subsTraffic);
        if (trackFlightFromFr) {
          flightFR = {
            ...trackFlightFromFr,
            arrival_date: 0,
            departure_date: 0,
            flight_num: "'",
            flight_status: "Scheduled",
            type_traffic: subsTraffic.type_traffic,
            traffic_diverted_to: "",
          };
        }
      }
      if (flightFR) {
        if (flightFR.est_departure_time) {
          realTime.time.estimated.departure = flightFR.est_departure_time;
        }
        if (flightFR.est_arrival_time) {
          realTime.time.estimated.arrival = flightFR.est_arrival_time;
          if (timeCompareNow(flightFR.est_arrival_time) > 0) {
            flightStatus = "Landed";
          }
        }
        if (flightFR.act_departure_time) {
          realTime.time.real.departure = flightFR.act_departure_time;
          if (flightStatus != "Landed") {
            flightStatus = "onAir";
          }
        }
        if (flightFR.act_arrival_time) {
          realTime.time.real.arrival = flightFR.act_arrival_time;
          flightStatus = "Landed";
        }
        if (flightFR.flight_status === "Canceled") {
          flightStatus = "Canceled";
        }
      }
      //Update traffic if changed
      const trafficToChange = getTrafficChanged(
        subsTraffic,
        realTime,
        flightStatus
      );
      if (trafficToChange) {
        await updateTraffic(subsTraffic.id, trafficToChange);
        //notify by mail
        await shouldNotify(subsTraffic, realTime.time.estimated);
      } else {
        var dateCheck = chaineToDate(uniqueTraficItem.date.toString());
        var differnceDay = dateDifferenceNow(dateCheck);
        if (differnceDay > 1) {
          subsTraffic.flight_status = "Landed";
          await updateTraffic(subsTraffic.id, { flight_status: "Landed" });
        }
      }
    }
  }
  if (observationInsert.length > 0) {
    await insertObservations(observationInsert);
  }
  return { status: true };
  //
}

function getAllFlightNum(flight: Flight) {
  const { flight_num, flight_icao, local_name } = flight;
  return [flight_num, flight_icao, local_name];
}

// //get the traffic to change
function getTrafficChanged(
  traffic: Traffic,
  realTime: {
    time: {
      real: {
        arrival: string;
        departure: string;
      };
      estimated: {
        arrival: string;
        departure: string;
      };
    };
    comment: string;
  },
  flightStatus: string
) {
  const track: {
    est_arrival_time?: string | null;
    est_departure_time?: string | null;
    act_arrival_time?: string | null;
    act_departure_time?: string | null;
    flight_status?: string | null;
  } = {};
  if (
    traffic.act_arrival_time != realTime.time.real.arrival &&
    realTime.time.real.arrival
  ) {
    track.act_arrival_time = realTime.time.real.arrival;
  }

  if (
    traffic.act_departure_time != realTime.time.real.departure &&
    realTime.time.real.departure
  ) {
    track.act_departure_time = realTime.time.real.departure;
  }

  if (
    traffic.est_arrival_time != realTime.time.estimated.arrival &&
    realTime.time.estimated.arrival
  ) {
    track.est_arrival_time = realTime.time.estimated.arrival;
  }

  if (
    traffic.est_departure_time != realTime.time.estimated.departure &&
    realTime.time.estimated.departure
  ) {
    track.est_departure_time = realTime.time.estimated.departure;
  }
  if (traffic.flight_status != flightStatus) {
    track.flight_status = flightStatus;
  }
  const finalTrack = Object.fromEntries(
    Object.entries({
      est_arrival_time: track.est_arrival_time,
      est_departure_time: track.est_departure_time,
      act_arrival_time: track.act_arrival_time,
      act_departure_time: track.act_departure_time,
      flight_status: track.flight_status,
    }).filter(([, v]) => v !== undefined)
  );

  const isTrackEmpty = Object.values(track).every((v) => v === undefined);
  return isTrackEmpty ? undefined : finalTrack;
}

async function shouldNotify(
  flight: TrafficWithFlight,
  estimated: {
    arrival: string;
    departure: string;
  }
) {
  const req = {
    type: flight.type_traffic === "Arrival" ? "arrivée" : "départ",
    fromAirport: flight.Flight.from_airport,
    toAirport: flight.Flight.to_airport,
    idCentre: flight.id_centre,
    flightNum: flight.flight_num,
    schTime:
      flight.type_traffic === "Arrival"
        ? flight.sch_arrival_time
        : flight.sch_departure_time,
    estTime:
      flight.type_traffic === "Arrival"
        ? estimated.arrival
        : estimated.departure,
    date: flight.traffic_date,
  };
  if (req.estTime != "") {
    // const respon = await mailService(req);
    // console.log("Send mail");
    // console.log(req);
    // console.log(respon);
  }
}
