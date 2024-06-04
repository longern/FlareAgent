import { createAsyncThunk } from "@reduxjs/toolkit";

import { createMessage } from ".";

async function responseToDataUrl(response: Response) {
  const blob = await response.blob();
  const dataUrl = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
  return dataUrl;
}

const textToSpeechThunk = createAsyncThunk(
  "conversations/textToSpeech",
  async (prompt: string, { dispatch, signal }) => {
    const { OpenAI } = await import("openai");
    const openaiApiKey = localStorage.getItem("OPENAI_API_KEY") ?? "";
    const baseURL = localStorage.getItem("OPENAI_BASE_URL");
    const openai = new OpenAI({
      apiKey: openaiApiKey,
      baseURL,
      dangerouslyAllowBrowser: true,
    });
    const speech: Response = await openai.audio.speech.create(
      { input: prompt, model: "tts-1-hd", voice: "alloy" },
      { signal }
    );
    const messageId = crypto.randomUUID();
    const audioUrl = await responseToDataUrl(speech);
    dispatch(
      createMessage({
        id: messageId,
        author_role: "assistant",
        content: [{ type: "audio_url", audio_url: { url: audioUrl } }],
        create_time: Date.now(),
      })
    );
  }
);

export default textToSpeechThunk;
