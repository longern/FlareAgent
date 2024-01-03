import { Hono } from "hono";

const app = new Hono();

const TOOL_LIST = ["tool://time/openapi.json"];

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

export default app;
