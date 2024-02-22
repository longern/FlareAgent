import { Hono } from "hono";
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
    const memory = text ? JSON.parse(text) : null;
    return Response.json(memory);
  } catch (e) {
    return Response.json(null, { status: 404 });
  }
});

app.delete("/", async (context) => {
  const root = await DIRECTORY;

  const directory = await root.getDirectoryHandle(".flareagent");
  const fileHandle = await directory.getFileHandle("memory.json", {
    create: true,
  });

  const file = await fileHandle.getFile();
  const text = await file.text();
  const memory = text ? (JSON.parse(text) as Array<string>) : [];
  const body = await context.req.json();
  memory.splice(body.index, 1);
  const writer = await fileHandle.createWritable();
  await writer.write(JSON.stringify(memory));
  await writer.close();

  return Response.json({ success: true });
});

const DEFINITION = {
  openapi: "3.0.1",
  info: {
    title: "Memory",
    description: "Manage memory",
    version: "v1",
  },
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
                    description: "Memory expressed in text",
                    required: true,
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
                    required: true,
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
  return Response.json(DEFINITION);
});

export default app;
