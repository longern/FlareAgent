import { Hono } from "hono";

const app = new Hono();

app.post("/", async (context) => {
  const body = await context.req.text();
  return fetch("/search", {
    method: "POST",
    body,
    headers: {
      "Content-Type": "application/json",
    },
  });
});

const DEFINITION = {
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
};

app.get("/openapi.json", async () => {
  return Response.json(DEFINITION);
});

export default app;
