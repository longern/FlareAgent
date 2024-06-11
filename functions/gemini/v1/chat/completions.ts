import {
  ChatCompletionAssistantMessageParam,
  ChatCompletionContentPart,
  ChatCompletionMessageToolCall,
  ChatCompletionTool,
} from "openai/resources/index.mjs";

import { verifyJwt } from "../../../api/auth/utils";

interface Env {
  GOOGLE_API_KEY: string;
  SECRET_KEY?: string;
}

function openaiResponseStream() {
  const textEncoder = new TextEncoder();
  const textDecoder = new TextDecoder();
  let buffer = "";
  let initialized = false;
  return new TransformStream<ArrayBuffer, ArrayBuffer>({
    transform(
      chunk: ArrayBuffer,
      controller: TransformStreamDefaultController<ArrayBuffer>
    ) {
      try {
        const error = JSON.parse(textDecoder.decode(chunk)).error;
        controller.enqueue(
          textEncoder.encode(`event: error\ndata: ${JSON.stringify(error)}\n\n`)
        );
        return;
      } catch {}
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
        const part = object.candidates[0].content.parts[0] as
          | { text: string }
          | { functionCall: { name: string; args: any } };
        const delta: Partial<ChatCompletionAssistantMessageParam> | null =
          "text" in part
            ? { content: part.text }
            : "functionCall" in part
            ? {
                tool_calls: [
                  {
                    index: 0,
                    type: "function",
                    id: crypto.randomUUID(),
                    function: {
                      name: part.functionCall.name,
                      arguments: JSON.stringify(part.functionCall.args),
                    },
                  } as ChatCompletionMessageToolCall,
                ],
              }
            : null;

        if (!initialized) {
          const choices = {
            choices: [{ index: 0, delta: { role: "assistant" } }],
          };
          controller.enqueue(
            textEncoder.encode(`data: ${JSON.stringify(choices)}\n\n`)
          );
          initialized = true;
        }

        const choices = { choices: [{ index: 0, delta }] };
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

function convertMessage(message: {
  role: string;
  content: string | ChatCompletionContentPart[] | null;
  tool_calls?: ChatCompletionMessageToolCall[];
}) {
  if (message.content === null) {
    return {
      role: "model",
      parts: (message.tool_calls ?? []).map((call) => ({
        functionCall: {
          name: call.function.name,
          args: JSON.parse(call.function.arguments),
        },
      })),
    };
  }

  if (message.role === "tool") {
    return {
      role: "function",
      parts: [
        {
          functionResponse: {
            name: "tool",
            response: JSON.parse(message.content as string),
          },
        },
      ],
    };
  }

  const parts =
    typeof message.content === "string"
      ? [{ text: message.content }]
      : message.content.map((part) =>
          part.type === "text"
            ? { text: part.text }
            : part.type === "image_url"
            ? { inline_data: { mime_type: "image/png", data: part.image_url } }
            : null
        );

  return {
    role: message.role === "assistant" ? "model" : "user",
    parts,
  };
}

function convertMessages(
  messages: Array<{
    role: string;
    content: string | ChatCompletionContentPart[] | null;
  }>,
  tools?: ChatCompletionTool[]
) {
  const systemPrompt = messages.find((message) => message.role === "system");
  const contents = messages
    .filter((message) => message.role !== "system")
    .map(convertMessage);

  return {
    contents,
    tools: Array.isArray(tools)
      ? { functionDeclarations: tools.map((tool) => tool.function) }
      : undefined,
    systemInstruction: systemPrompt ? convertMessage(systemPrompt) : undefined,
  };
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
    tools?: ChatCompletionTool[];
    stream: boolean;
  }>();
  const { model, messages, tools, stream } = body;

  const answer = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:${
      stream ? "streamGenerateContent" : "generateContent"
    }?alt=sse&key=${env.GOOGLE_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(convertMessages(messages, tools)),
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
