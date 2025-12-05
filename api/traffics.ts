import http from "http";
import { flightService } from "../src/flight.service";
import { initDatabaseService } from "../src/init.database.service";

const PORT = process.env.PORT || 3000;

// Simple router
const server = http.createServer((req, res) => {
  const { url, method } = req;

  // JSON header
  res.setHeader("Content-Type", "application/json");
  if (req.method === "GET") {
    if (req.url === "/flight") {
      return res.end(JSON.stringify(flightService()));
    }
    if (req.url === "/init") {
      return res.end(JSON.stringify(initDatabaseService()));
    }
  }

  // if (url === "/api/hello" && method === "GET") {
  //   return res.end(JSON.stringify({ message: "Hello from Node + TS API!" }));
  // }

  // if (url === "/api/time" && method === "GET") {
  //   return res.end(JSON.stringify({ now: Date.now() }));
  // }

  if (method === "POST") {
    return res.end(JSON.stringify({ now: Date.now() }));
  }

  // 404
  res.statusCode = 404;
  res.end(JSON.stringify({ error: "Not Found" }));
});

server.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
