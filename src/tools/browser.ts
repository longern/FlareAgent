import { Hono } from "hono";
import { OpenAPIV3 } from "openapi-types";
import YAML from "yaml";

const app = new Hono();

app.post("/", async (context) => {
  const body: { url: string } = await context.req.json();
  const url = new URL(body.url);
  const response = await fetch(`/crawl/${url.hostname}${url.pathname}`, {
    signal: context.req.raw.signal,
  });
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
    return new Response(textContent.slice(0, 65536));
  }

  return new Response((document.body.textContent ?? "").slice(0, 65536));
});

const DEFINITION: OpenAPIV3.Document = {
  openapi: "3.0.1",
  info: {
    title: "Browser",
    description: "Browse a web page",
    version: "v1",
  },
  servers: [{ url: "http://localhost-tools/" }],
  paths: {
    "/browser": {
      post: {
        operationId: "browser",
        summary: "Browse a web page",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  url: {
                    type: "string",
                    description: "The url to browse (must be https)",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Page content",
          },
        },
      },
    },
  },
};

app.get("/openapi.yml", async () => {
  return new Response(YAML.stringify(DEFINITION));
});

export default app;
