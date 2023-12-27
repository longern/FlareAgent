import { meta as getWeatherMeta } from "./get-weather";
import { meta as searchMeta } from "./search";

export const onRequestGet: PagesFunction = async (context) => {
  return Response.json({
    tools: [
      {
        type: "function",
        function: getWeatherMeta,
      },
      {
        type: "function",
        function: searchMeta,
      },
    ],
  });
};
