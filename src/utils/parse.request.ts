import { VercelRequest } from "@vercel/node";
import "dotenv/config";
import { AutorisationFailures } from "../types/failures";

export function autorizationMiddleware(hed: any) {
  console.log(hed);
  const autorisation = hed["functionkey"];
  console.log("autorisation", autorisation);
  if (autorisation !== process.env.FUNCTION_KEY) {
    throw new AutorisationFailures();
  }
}
