export interface RequestFlight {
  // typeTraffic: "Arrival" | "Departure";
  // fromCodeAirport: string | undefined;
  // fromAirport: string | undefined;
  // toCodeAirport: string | undefined;
  // toAirport: string | undefined;
  // heure: string;
  // airline: string;
  // flightNum: string;
  typeTraffic: "Arrival" | "Departure";
  flightNum: string;
  airport: string;
}

export interface RequestTraffic {
  typeTraffic: "Arrival" | "Departure";
  flightNum: string;
  flightDate: number;
  airport: string;
}
