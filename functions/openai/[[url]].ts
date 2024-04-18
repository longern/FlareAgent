import { verifyJwt } from "../auth/utils";

interface Env {
  OPENAI_API_KEY?: string;
  SECRET_KEY?: string;
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
