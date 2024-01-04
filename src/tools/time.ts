import { Hono } from "hono";

const app = new Hono();

app.post("/", async (context) => {
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

const DEFINITION = {
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
};

app.get("/openapi.json", async () => {
  return Response.json(DEFINITION);
});

export default app;
