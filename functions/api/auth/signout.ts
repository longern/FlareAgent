export const onRequestPost: PagesFunction = async function () {
  return Response.json(
    { success: true },
    {
      headers: {
        "Set-Cookie": `token=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`,
      },
    }
  );
};
