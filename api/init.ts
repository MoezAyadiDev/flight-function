import type { VercelRequest, VercelResponse } from "@vercel/node";
import { initEndpoint } from "../src/endpoints/init.endpoint";
import { parseInit } from "../src/utils/parse.request";
import { Failures } from "../src/types/failures";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    parseInit(req);
    const response = await initEndpoint();
    return res.json(response);
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
