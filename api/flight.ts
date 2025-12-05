import type { VercelRequest, VercelResponse } from "@vercel/node";
import { flightService } from "../src/services/flight.service";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  //const { name = "World" } = req.query;
  return res.json(await flightService());
}
