import { verifyJwt } from "../../auth/utils";

interface Env {
  AI: any;
  SECRET_KEY?: string;
}

export const onRequestPost: PagesFunction<Env> = async function (context) {
  const { request, env } = context;

  const isJwtVerified = await verifyJwt(context);
  if (!isJwtVerified) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  const body = await request.json<{
    model: string;
    messages: any[];
    stream: boolean;
  }>();
  const { model, messages, stream } = body;
  const answer = await env.AI.run(`@cf/meta/${model}`, {
    messages,
    stream,
  });
  return new Response(answer, {
    headers: {
      "Content-Type": stream ? "text/event-stream" : "application/json",
    },
  });
};
