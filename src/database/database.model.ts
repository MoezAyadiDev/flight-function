interface MTable {
  created_at: string;
  id: number;
}
export interface MAirport extends MTable {
  airport_name: string | null;
  alt: number | null;
  country: string | null;
  iata: string | null;
  icao: string | null;
  lat: number | null;
  lon: number | null;
}
export interface MAeroport extends MTable {
  api_url: string | null;
  code: string | null;
  icao: string | null;
  nom: string | null;
  operateur: "OACA" | "TAV";
}

export interface MAirline extends MTable {
  airline_name: string | null;
  code: string | null;
  icao: string | null;
}

export interface MApiTime extends MTable {
  info_time: number;
}
export interface MFlight extends MTable {
  airline: string | null;
  arrival_time: string | null;
  departure_time: string | null;
  duration: number | null;
  flight_icao: string | null;
  flight_num: string | null;
  flight_time: string | null;
  from_airport: string | null;
  from_code_airport: string | null;
  local_name: string | null;
  to_airport: string | null;
  to_code_airport: string | null;
}
export interface MObservation extends MTable {
  observation: string | null;
  provenance: string | null;
  trafic_id: number;
}
export interface MSubscription extends MTable {
  airport: string | null;
  date_traffic: number;
  flight_num: string | null;
  subscription_status: number;
  trafic_id: number;
  type_traffic: "Arrival" | "Departure";
}
export interface MTrack extends MTable {
  alt: number | null;
  lat: number | null;
  lon: number | null;
  speed: number | null;
  time_stamp: number | null;
  trafic_id: number;
  vertical_speed: number | null;
}
export interface MTraffic extends MTable {
  act_arrival_time: string | null;
  act_departure_time: string | null;
  arrival_date: number;
  departure_date: number;
  est_arrival_time: string | null;
  est_departure_time: string | null;
  flight_id: number;
  flight_num: string | null;
  flight_status: "Scheduled" | "onAir" | "Landed" | null;
  fr_num: string | null;
  from_airport: string | null;
  from_code_airport: string | null;
  sch_arrival_time: string | null;
  sch_departure_time: string | null;
  to_airport: string | null;
  to_code_airport: string | null;
}

// 1. Map all your table names to their row interfaces
export type DatabaseTables = {
  Airport: MAirport;
  //   Aeroport: MAeroport;
  //   Airline: MAirline;
  //   ApiTime: MApiTime;
  //   Flight: MFlight;
  //   Observation: MObservation;
  //   Subscription: MSubscription;
  //   Track: MTrack;
  //   Traffic: MTraffic;
};

// 2. Define the key type for all valid table names
export type TableName = keyof DatabaseTables;
