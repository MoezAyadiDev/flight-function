import type { VercelRequest, VercelResponse } from "@vercel/node";
import { flightService } from "../src/services/flight.service";
import { parseFlight } from "../src/utils/parse.request";
import { Failures } from "../src/types/failures";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  //const { name = "World" } = req.query;

  try {
    parseFlight(req);
    return res.json(await flightService());
  } catch (error) {
    if (error instanceof Failures) {
      res.status(error.statusCode).json(error.toJson());
    }
  }
}
