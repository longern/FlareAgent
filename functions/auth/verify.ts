import jwt from "@tsndr/cloudflare-worker-jwt";
import { secp256k1 } from "@noble/curves/secp256k1";

interface Env {
  SECRET_KEY?: string;
  AUTHORIZED_KEYS?: string;
}

export const onRequestPost: PagesFunction<Env> = async function (context) {
  const secret = Uint8Array.from(atob(context.env.SECRET_KEY), (c) =>
    c.charCodeAt(0)
  );
  const body = await context.request.json();
  const {
    response: { clientDataJSON, signature },
  } = body as {
    response: { clientDataJSON: string; signature: string };
  };
  const clientData: { challenge: string } = JSON.parse(clientDataJSON);
  const timestampArray = Uint8Array.from(atob(clientData.challenge), (c) =>
    c.charCodeAt(0)
  ).slice(0, 8).buffer;
  const timestamp = Number(new BigInt64Array(timestampArray)[0]);

  if (Date.now() - timestamp > 5 * 60 * 1000) {
    return Response.json({ error: "Challenge expired" }, { status: 403 });
  }

  const key = await crypto.subtle.importKey(
    "raw",
    secret,
    { name: "HMAC", hash: "SHA-256" },
    true,
    ["verify"]
  );
  const challangeSignature = Uint8Array.from(atob(clientData.challenge), (c) =>
    c.charCodeAt(0)
  ).slice(8);
  const isValid = await crypto.subtle.verify(
    "HMAC",
    key,
    challangeSignature,
    timestampArray
  );

  if (!isValid) {
    return Response.json({ error: "Invalid challenge" }, { status: 403 });
  }

  const authorizedKeys = context.env.AUTHORIZED_KEYS?.split(",") || [];
  const signatureArray = Uint8Array.from(atob(signature), (c) =>
    c.charCodeAt(0)
  );
  const digest = new Uint8Array(
    await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(clientDataJSON)
    )
  );
  for (const key of authorizedKeys) {
    const publicKey = Uint8Array.from(atob(key), (c) => c.charCodeAt(0));
    if (secp256k1.verify(signatureArray, digest, publicKey)) {
      const token = await jwt.sign(
        { key, exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60 },
        context.env.SECRET_KEY
      );
      return Response.json({ token });
    }
  }
  return Response.json({ error: "Unauthorized" }, { status: 401 });
};
