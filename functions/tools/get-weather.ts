export const meta = {
  name: "getWeather",
  description: "Get the current weather",
  parameters: {
    type: "object",
    properties: {
      location: {
        type: "string",
        description: "The city and state, e.g. San Francisco, CA",
      },
      format: {
        type: "string",
        enum: ["celsius", "fahrenheit"],
        description:
          "The temperature unit to use. Infer this from the users location.",
      },
    },
    required: ["location", "format"],
  },
};

export function getWeather({
  location,
  format,
}: {
  location: string;
  format: string;
}) {
  return { result: "Sunny" };
}

export const onRequestPost: PagesFunction = async function (context) {
  const { request } = context;
  const body: { location: string; format: string } = await request.json();
  return Response.json(getWeather(body));
};
