import type { VercelRequest, VercelResponse } from "@vercel/node";
import { initDatabaseService } from "../src/services/init.database.service";
import { parseInit } from "../src/utils/parse.request";
import { Failures } from "../src/types/failures";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    parseInit(req);
    const response = await initDatabaseService();
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
