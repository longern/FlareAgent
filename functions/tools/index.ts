import { meta as searchMeta } from "./search";

export const onRequestGet: PagesFunction = async (context) => {
  return Response.json({
    tools: [
      {
        type: "function",
        function: searchMeta,
      },
    ],
  });
};
