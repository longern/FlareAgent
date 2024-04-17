import jwt from "@tsndr/cloudflare-worker-jwt";

interface Env {
  OPENAI_API_KEY?: string;
  SECRET_KEY?: string;
}

function verifyJwt(context: { request: Request; env: Env }): Promise<boolean> {
  const { request, env } = context;
  if (!env.SECRET_KEY) return Promise.resolve(true);
  const authorization = request.headers.get("Authorization");
  const token = authorization?.split("Bearer ")[1];
  if (!token) return Promise.resolve(false);
  return jwt.verify(token, env.SECRET_KEY).catch(() => false);
}

export const onRequest: PagesFunction<Env> = async function (context) {
  const { request, env, params } = context;
  const isJwtVerified = await verifyJwt(context);
  const pathname = (params.url as string[]).join("/");
  const targetUrl = `https://api.openai.com/v1/${pathname}`;
  const authorization = isJwtVerified
    ? `Bearer ${env.OPENAI_API_KEY}`
    : request.headers.get("Authorization") ||
      (env.OPENAI_API_KEY ? `Bearer ${env.OPENAI_API_KEY}` : "");

  if (!authorization) {
    return Response.json(
      { error: "OpenAI API token not found" },
      { status: 500 }
    );
  }

  const targetRequest = new Request(targetUrl, {
    method: request.method,
    body: request.body,
    headers: {
      Authorization: authorization,
      "Content-Type": request.headers.get("Content-Type"),
    },
  });
  return fetch(targetRequest);
};
