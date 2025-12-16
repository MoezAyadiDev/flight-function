export interface RequestFlight {
  typeTraffic: "Arrival" | "Departure";
  flightNum: string;
  airport: string;
}

export interface RequestTraffic {
  typeTraffic: "Arrival" | "Departure";
  flightNum: string;
  flightDate: number;
  airport: string;
  idCentre: number;
}
