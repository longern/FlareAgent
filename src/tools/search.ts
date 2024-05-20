import { Hono } from "hono";
import { OpenAPIV3 } from "openapi-types";
import YAML from "yaml";

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

const DEFINITION: OpenAPIV3.Document = {
  openapi: "3.0.1",
  info: {
    title: "Search API",
    description: "Search the web",
    version: "v1",
  },
  servers: [{ url: "tool://" }],
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
  return new Response(YAML.stringify(DEFINITION));
});

export default app;
