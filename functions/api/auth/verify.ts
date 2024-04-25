import jwt from "@tsndr/cloudflare-worker-jwt";
import { secp256k1 } from "@noble/curves/secp256k1";
import base58 from "bs58";
import { base64ToUint8Array } from "./utils";

interface Env {
  SECRET_KEY?: string;
  AUTHORIZED_KEYS?: string;
}

export const onRequestPost: PagesFunction<Env> = async function (context) {
  const secret = base64ToUint8Array(context.env.SECRET_KEY);
  const body = await context.request.json();
  const {
    response: { clientDataJSON, signature },
  } = body as {
    response: { clientDataJSON: string; signature: string };
  };
  const clientData: { challenge: string } = JSON.parse(clientDataJSON);
  const challenge = base64ToUint8Array(clientData.challenge);
  const timestampAndSalt = challenge.slice(0, 16).buffer;
  const timestamp = Number(new BigInt64Array(timestampAndSalt)[0]);

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
  const challangeSignature = challenge.slice(16);
  const isValid = await crypto.subtle.verify(
    "HMAC",
    key,
    challangeSignature,
    timestampAndSalt
  );

  if (!isValid) {
    return Response.json({ error: "Invalid challenge" }, { status: 403 });
  }

  const authorizedKeys = context.env.AUTHORIZED_KEYS?.split(",") || [];
  const signatureArray = base64ToUint8Array(signature);
  const digest = new Uint8Array(
    await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(clientDataJSON)
    )
  );
  for (const key of authorizedKeys) {
    const publicKey = base64ToUint8Array(key);
    if (secp256k1.verify(signatureArray, digest, publicKey)) {
      const hash = await crypto.subtle.digest("SHA-256", publicKey.buffer);
      const fingerprint = base58.encode(new Uint8Array(hash.slice(0, 20)));
      const token = await jwt.sign(
        {
          id: fingerprint,
          exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
        },
        context.env.SECRET_KEY
      );
      return Response.json(
        { success: true },
        {
          headers: {
            "Set-Cookie": `token=${token}; Path=/; HttpOnly; Secure; SameSite=Strict`,
          },
        }
      );
    }
  }
  return Response.json({ error: "Unauthorized" }, { status: 401 });
};
