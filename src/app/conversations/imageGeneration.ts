import { createAsyncThunk } from "@reduxjs/toolkit";
import { ChatCompletionContentPart } from "openai/resources/index.mjs";

import { createMessage } from ".";

const imageGenerationThunk = createAsyncThunk(
  "conversations/fetchDrawings",
  async (prompt: string, { dispatch, signal }) => {
    const { OpenAI } = await import("openai");
    const openaiApiKey = localStorage.getItem("OPENAI_API_KEY") ?? "";
    const baseURL = localStorage.getItem("OPENAI_BASE_URL");
    const openai = new OpenAI({
      apiKey: openaiApiKey,
      baseURL,
      dangerouslyAllowBrowser: true,
    });
    const completion = await openai.images.generate(
      { model: "dall-e-3", prompt, response_format: "b64_json" },
      { signal }
    );
    const messageId = crypto.randomUUID();
    const contentParts = completion.data.map((data) => {
      return {
        type: "image_url",
        image_url: { url: "data:image/png;base64," + data.b64_json },
      } as ChatCompletionContentPart;
    });
    dispatch(
      createMessage({
        id: messageId,
        author_role: "assistant",
        content: contentParts,
        create_time: Date.now(),
      })
    );
  }
);

export default imageGenerationThunk;
