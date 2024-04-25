import { useCallback, useEffect, useState } from "react";
import OpenAI from "openai";
import { useAppSelector } from "../app/hooks";

export function useModels() {
  const [models, setModels] = useState<string[] | null>(null);
  const userId = useAppSelector((state) => state.identity.id);

  const fetchModels = useCallback(async () => {
    const openaiApiKey = localStorage.getItem("OPENAI_API_KEY") ?? "";
    const baseURL = localStorage.getItem("OPENAI_BASE_URL");
    if (!userId && !openaiApiKey) return;
    const openai = new OpenAI({
      apiKey: openaiApiKey,
      baseURL,
      dangerouslyAllowBrowser: true,
    });
    const models = await openai.models.list();
    setModels(
      models.data
        .filter(
          (model) =>
            model.owned_by === "system" &&
            ((model.id.startsWith("gpt-") && !model.id.includes("instruct")) ||
              model.id.startsWith("llama-") ||
              model.id.startsWith("qwen"))
        )
        .map((model) => model.id)
    );
  }, [userId]);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  return models;
}
