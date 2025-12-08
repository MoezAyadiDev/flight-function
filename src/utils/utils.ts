//Clean Airport name
export function cleanAiroport(airport: string) {
  if (!airport) return "";
  return airport
    .replaceAll("Airport", "")
    .replaceAll("International", "")
    .trim();
}

//Clean Airlines name
export function cleanAirline(airline: string) {
  return airline.replaceAll("Airlines", "").replaceAll("Airline", "").trim();
}
