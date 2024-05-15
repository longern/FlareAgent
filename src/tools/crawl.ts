import { Hono } from "hono";
import { OpenAPIV3 } from "openapi-types";

const app = new Hono();

app.post("/", async (context) => {
  const body: { url: string } = await context.req.json();
  const url = new URL(body.url);
  const response = await fetch(`/crawl/${url.hostname}${url.pathname}`);
  if (!response.ok) {
    return new Response(response.statusText, { status: response.status });
  }
  const html = await response.text();
  const {
    default: { Readability },
  } = await import("@mozilla/readability");
  const parser = new DOMParser();
  const document = parser.parseFromString(html, "text/html");
  const parseResult = new Readability(document).parse();

  if (parseResult) {
    const { textContent } = parseResult;
    return new Response(textContent.slice(0, 4096));
  }

  return new Response((document.body.textContent ?? "").slice(0, 4096));
});

const DEFINITION: OpenAPIV3.Document = {
  openapi: "3.0.1",
  info: {
    title: "Crawler",
    description: "Crawl a web page",
    version: "v1",
  },
  servers: [{ url: "tool://" }],
  paths: {
    "/crawl": {
      post: {
        operationId: "crawl",
        summary: "Crawl a web page",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  url: {
                    type: "string",
                    description: "The url to crawl (must be https)",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "The crawled page",
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
