import { ChatCompletionContentPart } from "openai/resources/index.mjs";
import { verifyJwt } from "../../../api/auth/utils";

interface Env {
  GOOGLE_API_KEY: string;
  SECRET_KEY?: string;
}

function openaiResponseStream() {
  const textEncoder = new TextEncoder();
  const textDecoder = new TextDecoder();
  let buffer = "";
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
      buffer += textDecoder.decode(chunk);
      const delimiterIndex = buffer.search(/\n\s*\n/);
      if (delimiterIndex === -1) return;
      const line = buffer.slice(0, delimiterIndex);
      buffer = buffer.slice(delimiterIndex + 2).trimStart();

      const text = line.replace(/^data: /, "").replace(/\n/g, "");

      if (text.trim() === "[DONE]") {
        controller.enqueue(chunk);
        return;
      }

      const object = JSON.parse(text);
      if (object.candidates) {
        const content: string = object.candidates[0].content.parts[0].text;
        const choices = { choices: [{ index: 0, delta: { content } }] };
        controller.enqueue(
          textEncoder.encode(`data: ${JSON.stringify(choices)}\n\n`)
        );
      } else if (object.error) {
        controller.enqueue(
          textEncoder.encode(`data: ${JSON.stringify(object)}\n\n`)
        );
      }
    },
  });
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

  function convertMessages(
    messages: Array<{
      role: string;
      content: string | ChatCompletionContentPart[];
    }>
  ) {
    return {
      contents: messages.map((message) => {
        return {
          role: message.role === "assistant" ? "model" : "user",
          parts:
            typeof message.content === "string"
              ? [{ text: message.content }]
              : message.content.map((part) =>
                  part.type === "text"
                    ? { text: part.text }
                    : part.type === "image_url"
                    ? {
                        inline_data: {
                          mime_type: "image/png",
                          data: part.image_url,
                        },
                      }
                    : null
                ),
        };
      }),
    };
  }

  const answer = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:${
      stream ? "streamGenerateContent" : "generateContent"
    }?alt=sse&key=${env.GOOGLE_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(convertMessages(messages)),
    }
  );
  const responseStream = stream
    ? answer.body.pipeThrough(openaiResponseStream())
    : answer.body;
  return new Response(responseStream, {
    headers: {
      "Content-Type": stream ? "text/event-stream" : "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
    },
  });
};
