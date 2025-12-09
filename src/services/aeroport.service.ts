import { Aeroport, findAeroportByCode } from "../repositories/aeroport.repo";
import { findAirportByIata } from "../repositories/airport.repo";
import { TrafficAirport, TrafficItem } from "../types/service.type";
import {
  chaineToDate,
  chaineToTimeTav,
  dateToChaine,
} from "../utils/date.util";
import { encodeQuery } from "../utils/string.util";
import { cleanAirport } from "../utils/utils";

export async function getAeroportTrafic(
  trafficItem: TrafficItem
): Promise<TrafficAirport[]> {
  const airport = await findAeroportByCode(trafficItem.codeAirport);
  if (!airport) return [];
  return airport.operateur === "OACA"
    ? await getOacaTraffic(trafficItem, airport)
    : await getTavTraffic(trafficItem, airport);
}

async function getOacaTraffic(trafficItem: TrafficItem, airport: Aeroport) {
  const isArrival: boolean = trafficItem.typeTrafic === "Arrival";
  process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";
  const maDate = chaineToDate(trafficItem.date.toString());
  const queryParam = {
    frmmvtCod: isArrival ? "A" : "D",
    frmaeropVil: "-1",
    frmnumVol: "",
    frmairport: airport.nom.toLowerCase(),
    frmhour: 0,
    frmday: maDate.getDate(),
    frmmonth: maDate.getMonth() + 1,
    frmacty: maDate.getFullYear(),
  };
  const urlApi = encodeQuery(queryParam);
  const targetUrl = `${airport.api_url}?${urlApi}`;
  const response = await fetch(targetUrl);
  const body = await response.json();
  const apiResponse = body.map((item: any) => ({
    typeTrafic: trafficItem.typeTrafic,
    formCodeAirport: "",
    fromAirport: isArrival ? item.direction : airport.nom,
    toCodeAirport: "",
    toAirport: isArrival ? airport.nom : item.direction,
    heure: item.heure,
    airline: item.compagnie,
    flightNum: item.numVol,
  }));
  return apiResponse;
}

//Get TAV Traffic
async function getTavTraffic(trafficItem: TrafficItem, airport: Aeroport) {
  const maDate = chaineToDate(trafficItem.date.toString());
  const queryParam = {
    flightLeg: trafficItem.typeTrafic === "Arrival" ? "ARR" : "DEP",
    date: dateToChaine(maDate, "AAAA-MM-JJ"),
    destination: "",
    airline: "",
    requestRawUrl:
      trafficItem.typeTrafic === "Arrival"
        ? "/en-EN/flights/arrival-flights"
        : "/en-EN/flights/departure-flights",
  };

  const urlApi = encodeQuery(queryParam);
  const response = await fetch(`${airport.api_url}?${urlApi}`);
  const body = await response.json();
  return await Promise.all(
    body.data.flights.map(async (item: any) => {
      const origin = await findAirportByIata(item.path.origin.originIata);
      const destination = await findAirportByIata(
        item.path.destination.destinationIata
      );

      return {
        typeTrafic: trafficItem.typeTrafic,
        formCodeAirport: origin ? origin.iata : item.path.origin.originIata,
        fromAirport: origin ? cleanAirport(origin.airport_name) : "",
        toCodeAirport: destination
          ? destination.iata
          : item.path.destination.destinationIata,
        toAirport: destination ? cleanAirport(destination.airport_name) : "",
        heure: chaineToTimeTav(item.stad),
        airline: item.airlineName,
        flightNum: `${item.airlineIata}${item.flightNumber}`,
      };
    })
  );
}
