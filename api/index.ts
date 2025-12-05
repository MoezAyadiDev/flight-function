import http from "http";

const PORT = process.env.PORT || 3000;

// Simple router
const server = http.createServer((req, res) => {
  const { url, method } = req;

  // JSON header
  res.setHeader("Content-Type", "application/json");

  if (url === "/api/hello" && method === "GET") {
    return res.end(JSON.stringify({ message: "Hello from Node + TS API!" }));
  }

  if (url === "/api/time" && method === "GET") {
    return res.end(JSON.stringify({ now: Date.now() }));
  }

  // 404
  res.statusCode = 404;
  res.end(JSON.stringify({ error: "Not Found" }));
});

server.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
