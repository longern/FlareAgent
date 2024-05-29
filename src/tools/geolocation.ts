import { Hono } from "hono";
import { OpenAPIV3 } from "openapi-types";
import YAML from "yaml";

const app = new Hono();

app.post("/", async () => {
  const position = await new Promise<GeolocationPosition>((resolve) =>
    navigator.geolocation.getCurrentPosition((position) => resolve(position))
  );
  const params = new URLSearchParams({
    lat: position.coords.latitude.toString(),
    lon: position.coords.longitude.toString(),
    format: "jsonv2",
  });
  const response = await fetch(
    `/crawl/nominatim.openstreetmap.org/reverse?${params}`
  );
  const data = await response.json();
  return Response.json(data);
});

const DEFINITION: OpenAPIV3.Document = {
  openapi: "3.0.1",
  info: {
    title: "Geolocation",
    description: "Get the geolocation of the user",
    version: "v1",
  },
  servers: [{ url: "http://localhost-tools/" }],
  paths: {
    "/geolocation": {
      post: {
        operationId: "geolocation",
        summary: "Get the geolocation of the user",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {},
              },
            },
          },
        },
        responses: {
          "200": {
            description: "The geolocation of the user",
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
