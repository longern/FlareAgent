import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Workflow } from "../workflow";
import { useSyncFS } from "../fs/hooks";
import OpenAI from "openai";

const fallbackWorkflows: Workflow[] = [];

export function useWorkflows() {
  const [workflows, setWorkflows] = useState<Workflow[] | null>(null);
  const { t } = useTranslation();

  useSyncFS({
    path: "/root/.flareagent/workflows.json",
    value: workflows,
    setValue: setWorkflows,
    fallbackValue: fallbackWorkflows,
  });

  const newWorkflow = useCallback(() => {
    setWorkflows((workflows) => {
      if (workflows === null) return;
      for (let i = 0; i < 1000; i++) {
        const name = `Workflow ${i + 1}`;
        if (workflows.find((workflow) => workflow.name === name)) {
          continue;
        }
        const workflow: Workflow = {
          name,
          nodes: [
            { id: "start", type: "start", data: { label: t("Start") } },
            {
              id: "user-input",
              type: "user-input",
              data: { label: t("User Input") },
            },
            {
              id: "assistant",
              type: "assistant",
              data: { label: t("LLM") },
            },
          ],
          edges: [
            {
              id: "e-start-user-input",
              source: "start",
              target: "user-input",
            },
            {
              id: "e-user-input-assistant",
              source: "user-input",
              target: "assistant",
            },
            {
              id: "e-assistant-user-input",
              source: "assistant",
              target: "user-input",
            },
          ],
        };
        return [...workflows, workflow];
      }
      return workflows;
    });
  }, [t]);

  return [workflows, setWorkflows, newWorkflow] as const;
}

export function useModels() {
  const [models, setModels] = useState<string[] | null>(null);

  const fetchModels = useCallback(async () => {
    const openaiApiKey = localStorage.getItem("OPENAI_API_KEY");
    const baseURL = localStorage.getItem("OPENAI_BASE_URL");
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
