import { Hono } from "hono";

const app = new Hono();

const TOOL_LIST = ["tool://time/openapi.json", "tool://search/openapi.json"];

app.get("/", () => {
  return Response.json({ tools: TOOL_LIST });
});

app.post("/time", async (context) => {
  const body: {
    timeZone: string;
  } = await context.req.json();
  try {
    return Response.json({
      time: new Date().toLocaleString(undefined, { timeZone: body.timeZone }),
    });
  } catch (e) {
    return Response.json({ error: e.message });
  }
});

app.get("/time/openapi.json", async () => {
  return Response.json({
    openapi: "3.0.1",
    info: {
      title: "Time API",
      description: "Get the current time",
      version: "v1",
    },
    paths: {
      "/time": {
        post: {
          operationId: "getCurrentTime",
          summary: "Get the current time",
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    timeZone: {
                      type: "string",
                      description: "Time zone names",
                      required: false,
                    },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "The time",
            },
          },
        },
      },
    },
  });
});

app.post("/search", async (context) => {
  const body = await context.req.raw.text();
  return fetch("/search", {
    method: "POST",
    body,
    headers: {
      "Content-Type": "application/json",
    },
  });
});

app.get("/search/openapi.json", async () => {
  return Response.json({
    openapi: "3.0.1",
    info: {
      title: "Search API",
      description: "Search the web",
      version: "v1",
    },
    paths: {
      "/search": {
        post: {
          operationId: "search",
          summary: "Search the web",
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    keyword: {
                      type: "string",
                      description: "The keyword to search",
                      required: true,
                    },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "The search results",
            },
          },
        },
      },
    },
  });
});

export default app;
