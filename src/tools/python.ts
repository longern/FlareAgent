import { Hono } from "hono";

import aiohttp from "./aiohttp";

const app = new Hono();

let pyodide: any;

export async function loadPython() {
  if (pyodide) return pyodide;
  if (typeof window === "undefined") return null;
  if (!("loadPyodide" in window)) {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js";
    await new Promise((resolve) => {
      script.onload = resolve;
      document.body.appendChild(script);
    });
  }
  pyodide = await (window as any).loadPyodide();

  const mountDir = "/root";
  pyodide.FS.mkdir(mountDir);
  pyodide.FS.mount(pyodide.FS.filesystems.IDBFS, { root: "." }, mountDir);
  pyodide.FS.chdir(mountDir);

  pyodide.runPython(aiohttp, { filename: "aiohttp.py" });

  return pyodide;
}

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
  const pyodide = await loadPython();
  if (!pyodide) {
    return Response.json({ error: "Failed to load python" }, { status: 500 });
  }
  try {
    const code = getCode(body);
    await pyodide.loadPackagesFromImports(code);
    await new Promise((resolve) => pyodide.FS.syncfs(true, resolve));
    const result = await pyodide.runPythonAsync(code);
    await new Promise((resolve) => pyodide.FS.syncfs(false, resolve));
    return new Response(result);
  } catch (e) {
    return new Response(e.message, { status: 400 });
  }
});

const DEFINITION = {
  openapi: "3.0.1",
  info: {
    title: "Python",
    description: "Run python code",
    version: "v1",
  },
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
                    description: "The python code to run",
                    required: true,
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
  return Response.json(DEFINITION);
});

export default app;
