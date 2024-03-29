import { Hono } from "hono";

import otherToolsRoute from "./other-tools";
import memoryRoute from "./memory";

import crawlRoute from "./crawl";
import dalle3Route from "./dalle-3";
import pythonRoute from "./python";
import searchRoute from "./search";

const app = new Hono();

const TOOL_LIST = [
  "tool://other-tools/openapi.json",
  "tool://memories/openapi.json",

  "tool://crawl/openapi.json",
  "tool://dalle-3/openapi.json",
  "tool://python/openapi.json",
  "tool://search/openapi.json",
];

app.get("/", () => {
  return Response.json({ tools: TOOL_LIST });
});

app.route("/other-tools", otherToolsRoute);

app.route("/memories", memoryRoute);

app.route("/crawl", crawlRoute);

app.route("/dalle-3", dalle3Route);

app.route("/python", pythonRoute);

app.route("/search", searchRoute);

export default app;
