export interface TrafficItem {
  codeAirport: string;
  typeTrafic: "Arrival" | "Departure";
  date: number;
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
