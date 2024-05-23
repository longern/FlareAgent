import { Hono } from "hono";
import { OpenAPIV3 } from "openapi-types";
import YAML from "yaml";
import store from "../app/store";
import { createMemory, deleteMemory } from "../app/memories";

const app = new Hono();

app.post("/", async (context) => {
  const body = await context.req.json<{ value: string }>();
  store.dispatch(
    createMemory({
      id: crypto.randomUUID(),
      content: body.value,
      create_time: Date.now(),
    })
  );

  return Response.json({ success: true });
});

app.get("/", async () => {
  const memories = store.getState().memories.memories;
  return Response.json(memories);
});

app.delete("/", async (context) => {
  const body = await context.req.json<{ id: string }>();
  store.dispatch(deleteMemory(body.id));

  return Response.json({ success: true });
});

const DEFINITION: OpenAPIV3.Document = {
  openapi: "3.0.1",
  info: {
    title: "Memory",
    description: "Manage memory",
    version: "v1",
  },
  servers: [{ url: "tool://" }],
  paths: {
    "/memories": {
      post: {
        operationId: "setMemory",
        summary: "Set a memory",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  value: {
                    type: "string",
                    description: "Memory expressed in whole sentences",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Success",
          },
        },
      },
      delete: {
        operationId: "deleteMemory",
        summary: "Delete a memory",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  index: {
                    type: "number",
                    description: "The index of the memory to delete",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Success",
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
