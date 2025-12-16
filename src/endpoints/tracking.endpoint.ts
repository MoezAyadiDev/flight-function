import {
  findFlightTracking,
  Traffic,
  updateTraffic,
} from "../repositories/traffic.repo";
import { getAeroportTracking } from "../services/aeroport.service";
import {
  ITrackingFlight,
  ITrafficFr,
  TrackAirport,
  TrafficItemShort,
} from "../types/service.type";
import { onlyUnique } from "../utils/utils";
import * as DateUtil from "../utils/date.util";
import { getTrackingFr } from "../services/fr.service";
import {
  findObserByIdTraf,
  insertObservations,
  Observation,
  ObservationInsert,
} from "../repositories/observation.repo";

export async function trackingEndpoint() {
  const traficsSubscribe = await findFlightTracking();

  //Get unique airport type traffic
  const traficUnique = traficsSubscribe
    .map<TrafficItemShort>((item) => ({
      codeAirport: item.traffic_airport,
      typeTrafic: item.type_traffic,
    }))
    .filter(onlyUnique);
  const observationInsert: ObservationInsert[] = [];
  for (const uniqueTraficItem of traficUnique) {
    const subsTraffics = traficsSubscribe.filter(
      (item) =>
        item.traffic_airport === uniqueTraficItem.codeAirport &&
        item.type_traffic === uniqueTraficItem.typeTrafic
    );
    const flights_id = subsTraffics.map((item) => item.id);
    const [traficAirport, traficFR, observations] = await Promise.all([
      getAeroportTracking({
        ...uniqueTraficItem,
        date: DateUtil.dateNowNumber(),
      }),
      getTrackingFr(uniqueTraficItem),
      findObserByIdTraf(flights_id),
    ]);

    for (const flight of subsTraffics) {
      var flightFR = traficFR.find(
        (item) =>
          item.flight_num == flight.fr_num ||
          item.flight_num == flight.flight_num
      );

      const flightAirport = traficAirport.find(
        (item) =>
          item.flightNum == flight.fr_num || item.flightNum == flight.flight_num
      );
      const comments = observations.filter(
        (item) => item.trafic_id === flight.id
      );
      observationInsert.push(
        ...(await checkFlightTrack(flight, flightFR, flightAirport, comments))
      );
    }
  }
  if (observationInsert.length > 0) {
    await insertObservations(observationInsert);
  }
  return { status: true };
}

async function checkFlightTrack(
  flight: ITrackingFlight,
  flightFr: ITrafficFr | undefined,
  flightAirport: TrackAirport | undefined,
  comments: Observation[]
) {
  const observationInsert: ObservationInsert[] = [];

  let realTime = {
    time: {
      real: { arrival: "", departure: "" },
      estimated: { arrival: "", departure: "" },
    },
    comment: "",
  };
  let flightStatus = "Scheduled";

  //Check Airport
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
        trafic_id: flight.id,
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
  //Check fr
  if (flightFr) {
    if (flightFr.est_departure_time) {
      realTime.time.estimated.departure = flightFr.est_departure_time;
    }
    if (flightFr.est_arrival_time) {
      realTime.time.estimated.arrival = flightFr.est_arrival_time;
      if (DateUtil.timeCompareNow(flightFr.est_arrival_time) > 0) {
        flightStatus = "Landed";
      }
    }
    if (flightFr.act_departure_time) {
      realTime.time.real.departure = flightFr.act_departure_time;
      if (flightStatus != "Landed") {
        flightStatus = "onAir";
      }
    }
    if (flightFr.act_arrival_time) {
      realTime.time.real.arrival = flightFr.act_arrival_time;
      flightStatus = "Landed";
    }
    if (flightFr.flight_status === "Canceled") {
      flightStatus = "Canceled";
    }
  }

  const trafficToChange = getTrafficChanged(flight, realTime, flightStatus);

  if (trafficToChange) {
    await updateTraffic(flight.id, trafficToChange);
    //notify by mail
    //await shouldNotify(subsTraffic, realTime.time.estimated);
  } else {
    var dateCheck = DateUtil.chaineToDate(flight.traffic_date.toString());
    var differnceDay = DateUtil.dateDifferenceNow(dateCheck);
    if (differnceDay > 1) {
      await updateTraffic(flight.id, { flight_status: "Landed" });
    }
  }
  return observationInsert;
}

// //get the traffic to change
function getTrafficChanged(
  traffic: ITrackingFlight,
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
