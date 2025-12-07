import "dotenv/config";
import {
  AutorisationFailures,
  MethodeFailures,
  QueryTypeFailure,
} from "../types/failures";
import { RequestFlight } from "../types/request.body";
import { QueryFailure } from "../types/failures";

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
  if (!flightRequest.fromAirport) {
    throw new QueryFailure("fromAirport");
  }
  if (!flightRequest.toAirport) {
    throw new QueryFailure("toAirport");
  }
  if (!flightRequest.heure) {
    throw new QueryFailure("heure");
  }
  if (!flightRequest.airline) {
    throw new QueryFailure("compagnie");
  }

  return flightRequest;
}
