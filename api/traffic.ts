import type { VercelRequest, VercelResponse } from "@vercel/node";
import { parseTraffics } from "../src/utils/parse.request";
import { Failures } from "../src/types/failures";
import { trafficEndpoint } from "../src/endpoints/traffic.endpoint";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const reqTraffic = parseTraffics(req);
    return res.json(await trafficEndpoint(reqTraffic));
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
