import { Hono } from "hono";

import crawlRoute from "./crawl";
import pythonRoute from "./python";
import searchRoute from "./search";
import timeRoute from "./time";

const app = new Hono();

const TOOL_LIST = [
  "tool://crawl/openapi.json",
  "tool://python/openapi.json",
  "tool://time/openapi.json",
  "tool://search/openapi.json",
];

app.get("/", () => {
  return Response.json({ tools: TOOL_LIST });
});

app.route("/crawl", crawlRoute);

app.route("/python", pythonRoute);

app.route("/search", searchRoute);

app.route("/time", timeRoute);

export default app;
