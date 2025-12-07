export interface RequestFlight {
  typeTraffic: "Arrival" | "Departure";
  fromCodeAirport: string | undefined;
  fromAirport: string;
  toCodeAirport: string | undefined;
  toAirport: string;
  heure: string;
  airline: string;
  flightNum: string;
}
