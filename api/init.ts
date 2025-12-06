import type { VercelRequest, VercelResponse } from "@vercel/node";
import { initDatabaseService } from "../src/init.database.service";
import { autorizationMiddleware } from "../src/utils/parse.request";
import { Failures } from "../src/types/failures";

export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    autorizationMiddleware(req);
    return res.json(initDatabaseService());
  } catch (error) {
    if (error instanceof Failures) {
      res.status(error.statusCode).json(error.toJson());
    }
  }
}
