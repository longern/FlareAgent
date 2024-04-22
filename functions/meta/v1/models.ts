export const onRequestGet: PagesFunction = async function () {
  return Response.json({
    object: "list",
    data: [
      {
        id: "llama-3-8b-instruct",
        object: "model",
        created: 1711473033,
        owned_by: "system",
      },
    ],
  });
};
