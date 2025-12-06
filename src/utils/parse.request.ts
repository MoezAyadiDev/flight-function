import { VercelRequest } from "@vercel/node";
import "dotenv/config";
import { AutorisationFailures } from "../types/failures";

export function autorizationMiddleware(req: VercelRequest) {
  const autorisation = req.headers["functionKey"];
  console.log(autorisation);
  if (autorisation !== process.env.FUNCTION_KEY) {
    throw new AutorisationFailures();
  }
}
