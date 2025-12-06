//Http get function
async function httpGet(url: string, headers = {}) {
  const res = await fetch(url, { headers });
  if (!res.ok) console.log(`Failed GET ${url}`);
  return await res.json();
}

//Get all Airline
export async function fetchAirlines() {
  const url = "https://www.flightradar24.com/_json/airlines.php";
  const apiResponse = await httpGet(url);
  return apiResponse.rows.map((item: any) => ({
    airline_name: item.Name,
    code: item.Code,
    icao: item.ICAO,
  }));
}

//Get the list of Airport
export async function fetchAirports() {
  const url = "https://www.flightradar24.com/_json/airports.php";
  const apiResponse = await httpGet(url);
  return apiResponse.rows.map((item: any) => ({
    airport_name: item.name,
    iata: item.iata,
    icao: item.icao,
    lat: item.lat,
    lon: item.lon,
    country: item.country,
    alt: item.alt,
  }));
}
