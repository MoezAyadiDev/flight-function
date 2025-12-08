import type { VercelRequest, VercelResponse } from "@vercel/node";
import { flightEndpoint } from "../src/endpoints/flight.endpoint";
import { parseFlight } from "../src/utils/parse.request";
import { Failures } from "../src/types/failures";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const reqFlight = parseFlight(req);
    return res.json(await flightEndpoint(reqFlight));
  } catch (error: any) {
    if (error instanceof Failures) {
      res.status(error.statusCode).json(error.toJson());
    }
    res.status(500).json({
      code: "SERVER_FAIL",
      message: error?.message ?? error,
    });
  }
}
