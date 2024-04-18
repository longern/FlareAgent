import jwt from "@tsndr/cloudflare-worker-jwt";

interface Env {
  SECRET_KEY?: string;
}

export async function verifyJwt(context: {
  request: Request;
  env: Env;
}): Promise<boolean> {
  const { request, env } = context;
  if (!env.SECRET_KEY) return true;
  const authorization = request.headers.get("Authorization");
  const token = authorization?.split("Bearer ")[1];
  if (!token) return false;
  try {
    return await jwt.verify(token, env.SECRET_KEY);
  } catch {
    return false;
  }
}
