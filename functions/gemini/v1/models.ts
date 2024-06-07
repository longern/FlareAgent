export const onRequestGet: PagesFunction = async function () {
  return Response.json({
    object: "list",
    data: [
      {
        id: "gemini-1.5-flash",
        object: "model",
        created: 1711473033,
        owned_by: "system",
      },
      {
        id: "gemini-1.5-pro",
        object: "model",
        created: 1711473033,
        owned_by: "system",
      },
    ],
  });
};
