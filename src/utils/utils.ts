//Clean Airport name
export function cleanAirport(airport: string) {
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

//Get only unique from list
export function onlyUnique(value: any, index: number, array: any[]) {
  return (
    array.findIndex((o) => {
      return JSON.stringify(o) === JSON.stringify(value);
    }) === index
  );
}
