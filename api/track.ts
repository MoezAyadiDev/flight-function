import type { VercelRequest, VercelResponse } from "@vercel/node";
import { parseTracks } from "../src/utils/parse.request";
import { Failures } from "../src/types/failures";
import { trackEndpoint } from "../src/endpoints/track.endpoint";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    parseTracks(req);
    return res.json(await trackEndpoint());
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
