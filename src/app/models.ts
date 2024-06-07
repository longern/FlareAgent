import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AppState } from "./store";

export const modelsSlice = createSlice({
  name: "error",
  initialState: {
    models: null as string[] | null,
    model: localStorage.getItem("OPENAI_MODEL") ?? "gpt-3.5-turbo",
  },
  reducers: {
    setModels(state, action: PayloadAction<string[]>) {
      state.models = action.payload;
    },

    setModel(state, action: PayloadAction<string>) {
      state.model = action.payload;
    },
  },
});

export const fetchModels = createAsyncThunk(
  "models/fetchModels",
  async (_: undefined, { getState, dispatch }) => {
    const { OpenAI } = await import("openai");

    const userId = (getState() as AppState).identity.id;
    const openaiApiKey = localStorage.getItem("OPENAI_API_KEY") ?? "";
    const baseURL = localStorage.getItem("OPENAI_BASE_URL");
    if (!userId && !openaiApiKey) return;
    const openai = new OpenAI({
      apiKey: openaiApiKey,
      baseURL,
      dangerouslyAllowBrowser: true,
    });
    const models = await openai.models.list();
    const filteredModelIds = models.data
      .filter(
        (model) =>
          (model.id.startsWith("gpt-") && model.created > 1715368132) ||
          [
            "gpt-4o",
            "gpt-4-turbo",
            "gpt-4",
            "gpt-3.5-turbo",
            "dall-e-3",
            "tts-1-hd",
          ].includes(model.id) ||
          model.id.startsWith("gemini-") ||
          model.id.startsWith("llama-") ||
          model.id.startsWith("qwen")
      )
      .map((model) => model.id);
    dispatch(setModels(filteredModelIds));
  }
);

export const { setModels } = modelsSlice.actions;

export const setModel = createAsyncThunk(
  "models/setModel",
  async (model: string, { dispatch }) => {
    localStorage.setItem("OPENAI_MODEL", model);
    dispatch(modelsSlice.actions.setModel(model));
    return model;
  }
);

export default modelsSlice.reducer;
