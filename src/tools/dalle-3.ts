import { Hono } from "hono";
import OpenAI from "openai";

const app = new Hono();

app.post("/", async (context) => {
  const body: {
    prompt: string;
  } = await context.req.json();
  const token = window.localStorage.getItem("OPENAI_API_KEY");
  if (!token) {
    return Response.json(
      { error: "OpenAI API token not found" },
      { status: 500 }
    );
  }
  const baseURL = window.localStorage.getItem("OPENAI_BASE_URL");
  const openai = new OpenAI({
    apiKey: token,
    baseURL,
    dangerouslyAllowBrowser: true,
  });
  const imageResponse = await openai.images.generate({
    prompt: body.prompt,
  });
  const imageUrls = imageResponse.data.map((image) => image.url);
  return Response.json({ images: imageUrls });
});

const DEFINITION = {
  openapi: "3.0.1",
  info: {
    title: "Dalle-3",
    description: "Generate an image given a prompt",
    version: "v1",
  },
  paths: {
    "/dalle-3": {
      post: {
        operationId: "generateImage",
        summary: "Generate an image given a prompt",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  prompt: {
                    type: "string",
                    description: "The prompt to generate an image from",
                    required: true,
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "URL of the generated image",
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
