import { Hono } from "hono";
import { OpenAPIV3 } from "openapi-types";
import YAML from "yaml";

import { DIRECTORY } from "../fs/hooks";

const app = new Hono();

app.post("/", async (context) => {
  const root = await DIRECTORY;

  const directory = await root.getDirectoryHandle(".flareagent");
  const fileHandle = await directory.getFileHandle("memory.json", {
    create: true,
  });

  const file = await fileHandle.getFile();
  const text = await file.text();
  const memory = text ? (JSON.parse(text) as Array<string>) : [];
  const body = (await context.req.json()) as { value: string };
  memory.push(body.value);
  const writer = await fileHandle.createWritable();
  await writer.write(JSON.stringify(memory));
  await writer.close();

  return Response.json({ success: true });
});

app.get("/", async () => {
  try {
    const root = await DIRECTORY;

    const directory = await root.getDirectoryHandle(".flareagent");
    const fileHandle = await directory.getFileHandle("memory.json");

    const file = await fileHandle.getFile();
    const text = await file.text();
    if (!text) throw new Error("No memory found");
    return new Response(text);
  } catch (e) {
    return Response.json(null, { status: 404 });
  }
});

app.delete("/", async (context) => {
  try {
    const root = await DIRECTORY;

    const directory = await root.getDirectoryHandle(".flareagent");
    const fileHandle = await directory.getFileHandle("memory.json");

    const file = await fileHandle.getFile();
    const text = await file.text();
    const memory = JSON.parse(text) as Array<string>;
    const body = await context.req.text();
    if (!body) {
      memory.splice(0, memory.length);
    } else {
      const { index } = JSON.parse(body);
      memory.splice(index, 1);
    }
    if (memory.length === 0) {
      await directory.removeEntry("memory.json");
      return Response.json({ success: true });
    }
    const writer = await fileHandle.createWritable();
    await writer.write(JSON.stringify(memory));
    await writer.close();

    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ success: false }, { status: 400 });
  }
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

app.get("/openapi.json", async () => {
  return new Response(YAML.stringify(DEFINITION));
});

export default app;
