import { base64ToUint8Array } from "./utils";

interface Env {
  SECRET_KEY?: string;
}

export const onRequestPost: PagesFunction<Env> = async function (context) {
  const secret = base64ToUint8Array(context.env.SECRET_KEY);
  const timestampAndSalt = new Uint8Array(16);
  const timestampArray = new Uint8Array(
    new BigInt64Array([BigInt(Date.now())]).buffer
  );
  timestampAndSalt.set(timestampArray);
  const salt = crypto.getRandomValues(new Uint8Array(8));
  timestampAndSalt.set(salt, 8);

  const key = await crypto.subtle.importKey(
    "raw",
    secret,
    { name: "HMAC", hash: "SHA-256" },
    true,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, timestampAndSalt);
  const challenge = btoa(
    String.fromCharCode(...timestampAndSalt, ...new Uint8Array(signature))
  );
  return Response.json({ challenge });
};
