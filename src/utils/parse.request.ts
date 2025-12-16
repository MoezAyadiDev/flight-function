import "dotenv/config";
import {
  AutorisationFailures,
  MethodeFailures,
  QueryTypeFailure,
  QueryListFailure,
  QueryItemFailure,
  QueryTypeItemFailure,
} from "../types/failures";
import { RequestFlight, RequestTraffic } from "../types/request.body";
import { QueryFailure } from "../types/failures";
import { isDateValid } from "./date.util";

function autorizationMiddleware(hed: any) {
  const autorisation = hed["functionkey"];
  if (autorisation !== process.env.FUNCTION_KEY) {
    throw new AutorisationFailures();
  }
}

function methodeMiddleware(methode: any) {
  if (methode != "POST") {
    throw new MethodeFailures();
  }
}

export function parseInit(req: any) {
  autorizationMiddleware(req.headers);
  methodeMiddleware(req.method);
}

export function parseFlight(req: any): RequestFlight {
  autorizationMiddleware(req.headers);
  methodeMiddleware(req.method);
  const flightRequest: RequestFlight = req.body;

  if (!flightRequest) throw new QueryFailure("flightNum");

  if (!flightRequest.flightNum) throw new QueryFailure("flightNum");

  if (!flightRequest.typeTraffic) throw new QueryFailure("typeTraffic");

  if (!["Arrival", "Departure"].includes(flightRequest.typeTraffic)) {
    throw new QueryTypeFailure("typeTraffic", "Arrival or Departure");
  }
  if (!flightRequest.airport) {
    throw new QueryFailure("airport");
  }

  return flightRequest;
}

function parseTraffic(trafficItem: any): RequestTraffic {
  if (!trafficItem) throw new QueryFailure("flightNum");

  if (!trafficItem.flightNum) throw new QueryFailure("flightNum");

  if (!trafficItem.typeTraffic)
    throw new QueryItemFailure("typeTraffic", trafficItem.flightNum);

  if (!["Arrival", "Departure"].includes(trafficItem.typeTraffic)) {
    throw new QueryTypeItemFailure(
      "typeTraffic",
      "Arrival or Departure",
      trafficItem.flightNum
    );
  }
  if (!trafficItem.flightDate) {
    throw new QueryItemFailure("flightDate", trafficItem.flightNum);
  }
  if (!isDateValid(trafficItem.flightDate)) {
    throw new QueryTypeItemFailure(
      "flightDate",
      "AAAAMMDD",
      trafficItem.flightNum
    );
  }

  if (!trafficItem.airport) {
    throw new QueryItemFailure("airport", trafficItem.flightNum);
  }

  if (!trafficItem.idCentre) {
    throw new QueryItemFailure("idCentre", trafficItem.flightNum);
  }
  if (isNaN(Number(trafficItem.idCentre))) {
    throw new QueryTypeItemFailure("idCentre", "Number", trafficItem.flightNum);
  }

  return trafficItem;
}

export function parseTraffics(req: any) {
  autorizationMiddleware(req.headers);
  methodeMiddleware(req.method);
  const trafficRequest: RequestTraffic[] = req.body;
  if (!Array.isArray(trafficRequest)) {
    throw new QueryListFailure();
  }
  const listBody: RequestTraffic[] = [];
  for (const trafficItem of trafficRequest) {
    listBody.push(parseTraffic(trafficItem));
  }

  return listBody;
}

export function parseTracks(req: any) {
  autorizationMiddleware(req.headers);
  methodeMiddleware(req.method);
}
