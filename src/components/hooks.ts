import { useCallback, useEffect, useState } from "react";
import OpenAI from "openai";

export function useModels() {
  const [models, setModels] = useState<string[] | null>(null);

  const fetchModels = useCallback(async () => {
    const openaiApiKey = localStorage.getItem("OPENAI_API_KEY");
    const baseURL = localStorage.getItem("OPENAI_BASE_URL");
    if (!openaiApiKey) return;
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
            (model.owned_by === "system" &&
              model.id.startsWith("gpt-") &&
              !model.id.includes("instruct")) ||
            model.id === "gpt-3.5-turbo" ||
            model.id === "gpt-4"
        )
        .map((model) => model.id)
    );
  }, []);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  return models;
}
