export const onRequestGet: PagesFunction = async function () {
  return Response.json({
    object: "list",
    data: [
      {
        id: "qwen1.5-14b-chat-awq",
        object: "model",
        created: 1711473033,
        owned_by: "system",
      },
    ],
  });
};
