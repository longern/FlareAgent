import { Hono } from "hono";
import { OpenAPIV3 } from "openapi-types";
import YAML from "yaml";

import { runPython } from "../python";

const app = new Hono();

app.post("/", async (context) => {
  function getCode(text: string) {
    try {
      const json: { code: string } = JSON.parse(text);
      return json.code;
    } catch (e) {
      return text;
    }
  }
  const body = await context.req.text();
  try {
    const code = getCode(body);
    const { result } = await runPython(code, {
      signal: context.req.raw.signal,
    });
    return new Response(result);
  } catch (e) {
    return new Response(e.message, { status: 400 });
  }
});

const DEFINITION: OpenAPIV3.Document = {
  openapi: "3.0.1",
  info: {
    title: "Python",
    description: "Run python code",
    version: "v1",
  },
  servers: [{ url: "tool://" }],
  paths: {
    "/python": {
      post: {
        operationId: "python",
        summary: "Run python code",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  code: {
                    type: "string",
                    description:
                      "The python code to run (top-level await supported)",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "The execution result",
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
