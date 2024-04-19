import { verifyJwt } from "../../auth/utils";

interface Env {
  AI: any;
  SECRET_KEY?: string;
}

export function openaiResponseStream() {
  const textEncoder = new TextEncoder();
  const textDecoder = new TextDecoder();
  return new TransformStream<ArrayBuffer, ArrayBuffer>({
    start(controller: TransformStreamDefaultController<ArrayBuffer>) {
      const choices = {
        choices: [{ index: 0, delta: { role: "assistant" } }],
      };
      controller.enqueue(
        textEncoder.encode(`data: ${JSON.stringify(choices)}\n\n`)
      );
    },
    transform(
      chunk: ArrayBuffer,
      controller: TransformStreamDefaultController<ArrayBuffer>
    ) {
      const text = textDecoder.decode(chunk).replace(/^data: /, "");

      if (text.trim() === "[DONE]") {
        controller.enqueue(chunk);
        return;
      }

      const object = JSON.parse(text);
      if (object.response) {
        const choices = {
          choices: [{ index: 0, delta: { content: object.response } }],
        };
        controller.enqueue(
          textEncoder.encode(`data: ${JSON.stringify(choices)}\n\n`)
        );
      }
    },
  });
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
  return new Response(answer.pipeThrough(openaiResponseStream()), {
    headers: {
      "Content-Type": stream ? "text/event-stream" : "application/json",
    },
  });
};
