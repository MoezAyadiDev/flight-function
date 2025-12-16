import { FlightStatus, TrafficType } from "../database/supabase";

export interface TrafficItem {
  codeAirport: string;
  typeTrafic: TrafficType;
  date: number;
  // idCentre: number;
}

export interface TrafficAirport {
  typeTrafic: "Arrival" | "Departure";
  formCodeAirport: string;
  fromAirport: string;
  toCodeAirport: string;
  toAirport: string;
  heure: string;
  airline: string;
  flightNum: string;
}

export interface TrackAirport {
  time: {
    real: {
      departure: string | undefined;
      arrival: string | undefined;
    };
    estimated: {
      departure: string | undefined;
      arrival: string | undefined;
    };
  };
  comment: string;
  flightNum: string;
}

export interface IFlightService {
  flight_num: string;
  flight_icao: string;
  arrival_time: string;
  from_code_airport: string;
  to_code_airport: string;
  departure_time: string;
  duration?: number | null | undefined;
  flight_time: string;
  airline: {
    name: string;
    iata: string;
    icao: string;
  };
}

export interface ITrafficFr {
  flight_num: string;
  type_traffic: TrafficType;
  departure_date: number;
  arrival_date: number;
  traffic_diverted_to: string | undefined;
  sch_arrival_time: string;
  sch_departure_time: string;
  act_arrival_time: string;
  act_departure_time: string;
  est_arrival_time: string;
  est_departure_time: string;
  flight_status: FlightStatus;
}
