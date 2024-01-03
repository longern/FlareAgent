import { Hono } from "hono";

const app = new Hono();

const TOOL_LIST = ["tool://time/openapi.json"];

app.get("/", () => {
  return Response.json({ tools: TOOL_LIST });
});

app.post("/time", async (context) => {
  const body: {
    locale: string;
  } = await context.req.json();
  return Response.json({ time: new Date().toLocaleString(body.locale) });
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
                    locale: {
                      type: "string",
                      description: "The locale to format the time",
                    },
                  },
                  required: [],
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
