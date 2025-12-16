import type { VercelRequest, VercelResponse } from "@vercel/node";
import { parseTrackings } from "../src/utils/parse.request";
import { Failures } from "../src/types/failures";
import { trackingEndpoint } from "../src/endpoints/tracking.endpoint";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    parseTrackings(req);
    return res.json(await trackingEndpoint());
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
