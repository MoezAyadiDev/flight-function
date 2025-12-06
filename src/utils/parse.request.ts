import { VercelRequest } from "@vercel/node";
import "dotenv/config";
import { AutorisationFailures, MethodeFailures } from "../types/failures";

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

export function parseFlight(req: any) {
  autorizationMiddleware(req.headers);
  methodeMiddleware(req.method);
}
