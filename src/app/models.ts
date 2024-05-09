import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AppState } from "./store";

export const modelsSlice = createSlice({
  name: "error",
  initialState: {
    models: null as string[] | null,
  },
  reducers: {
    setModels(state, action: PayloadAction<string[]>) {
      state.models = action.payload;
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
          model.owned_by === "system" &&
          ((model.id.startsWith("gpt-") && !model.id.includes("instruct")) ||
            model.id.startsWith("llama-") ||
            model.id.startsWith("qwen"))
      )
      .map((model) => model.id);
    dispatch(setModels(filteredModelIds));
  }
);

export const { setModels } = modelsSlice.actions;

export default modelsSlice.reducer;
