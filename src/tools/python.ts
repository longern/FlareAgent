import { Hono } from "hono";

const app = new Hono();

let pyodide: any;

async function loadPython() {
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
  return pyodide;
}

app.post("/", async (context) => {
  function getCode(text: string) {
    try {
      const json = JSON.parse(text);
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
    const result = pyodide.runPython(code);
    return new Response(result);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 400 });
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
