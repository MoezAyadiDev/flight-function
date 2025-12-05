import type { VercelRequest, VercelResponse } from "@vercel/node";
import { initDatabaseService } from "../src/init.database.service";
export default function handler(req: VercelRequest, res: VercelResponse) {
  //const { name = "World" } = req.query;
  return res.json(initDatabaseService());
}
