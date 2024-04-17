interface Env {
  SECRET_KEY?: string;
}

export const onRequestPost: PagesFunction<Env> = async function (context) {
  const secret = Uint8Array.from(atob(context.env.SECRET_KEY), (c) =>
    c.charCodeAt(0)
  );
  const timestamp = Date.now();
  const timestampArray = new BigInt64Array([BigInt(timestamp)]).buffer;

  const key = await crypto.subtle.importKey(
    "raw",
    secret,
    { name: "HMAC", hash: "SHA-256" },
    true,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, timestampArray);
  const challenge = btoa(
    String.fromCharCode(
      ...new Uint8Array(timestampArray),
      ...new Uint8Array(signature)
    )
  );
  return Response.json({ challenge });
};
