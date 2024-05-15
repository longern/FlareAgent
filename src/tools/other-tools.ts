import { Hono } from "hono";
import { OpenAPIV3 } from "openapi-types";

const app = new Hono();

app.post("/", async (context) => {
  const body: {
    keyword: string;
  } = await context.req.json();
  void body;
  return Response.json({ tools: [] });
});

const DEFINITION: OpenAPIV3.Document = {
  openapi: "3.0.1",
  info: {
    title: "Other Tools",
    description: "Search other tools",
    version: "v1",
  },
  paths: {
    "/other-tools": {
      post: {
        operationId: "searchOtherTools",
        summary:
          "If provided tools cannot satisfy your needs, search other tools.",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  keyword: {
                    type: "string",
                    description:
                      "One or two keyword in English to search tools",
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
