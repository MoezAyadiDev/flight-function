import { VercelRequest } from "@vercel/node";
import "dotenv/config";
import { AutorisationFailures } from "../types/failures";

export function autorizationMiddleware(hed: any) {
  const autorisation = hed["functionkey"];
  if (autorisation !== process.env.FUNCTION_KEY) {
    throw new AutorisationFailures();
  }
}
