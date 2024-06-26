import { verifyJwt } from "../../../api/auth/utils";
import { openaiResponseStream } from "../../../meta/v1/chat/completions";

interface Env {
  AI: any;
  SECRET_KEY?: string;
}

export const onRequestOptions: PagesFunction = async function () {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "POST",
    },
  });
};

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
  const answer: ReadableStream = await env.AI.run(`@cf/qwen/${model}`, {
    messages,
    stream,
  });
  return new Response(answer.pipeThrough(openaiResponseStream()), {
    headers: {
      "Content-Type": stream ? "text/event-stream" : "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
    },
  });
};
