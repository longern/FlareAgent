import jwt from "@tsndr/cloudflare-worker-jwt";

interface Env {
  SECRET_KEY?: string;
}

export function base64ToUint8Array(base64: string): Uint8Array {
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

function parseCookie(request: Request) {
  const cookie = request.headers.get("Cookie");
  if (!cookie) return undefined;

  const tokenSegment = cookie.split("; ").find((c) => c.startsWith("token="));
  if (!tokenSegment) return undefined;

  const token = tokenSegment.split("=")[1];
  return token;
}

export async function verifyJwt(context: {
  request: Request;
  env: Env;
}): Promise<boolean> {
  const { request, env } = context;
  if (!env.SECRET_KEY) return true;

  const token = parseCookie(request);
  try {
    return await jwt.verify(token, env.SECRET_KEY);
  } catch {
    return false;
  }
}

export function decodeJwt(context: { request: Request }): any {
  const { request } = context;

  const token = parseCookie(request);
  try {
    return jwt.decode(token).payload;
  } catch {
    return undefined;
  }
}
