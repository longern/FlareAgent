import { OpenAPIV3 } from "openapi-types";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Workflow } from "../workflow";
import { useTranslation } from "react-i18next";
import { useSyncFS } from "../fs/hooks";

const ActionsContext = createContext<{
  actions: OpenAPIV3.Document[];
  workflows: Workflow[] | null;
} | null>(null);
const SetActionsContext = createContext<{
  setActions: React.Dispatch<React.SetStateAction<OpenAPIV3.Document[] | null>>;
  setWorkflows: React.Dispatch<React.SetStateAction<Workflow[] | null>>;
  newWorkflow: () => void;
} | null>(null);

function useActions() {
  const [actions, setActions] = useState<OpenAPIV3.Document[]>([]);

  const fetchActions = useCallback(async () => {
    await import("../tools/scheme");
    const response = await fetch("tool://");
    const data: { tools: string[] } = await response.json();
    const toolsResult = await Promise.allSettled(
      data.tools.map(async (url) => {
        const response = await fetch(url);
        const tool: OpenAPIV3.Document = await response.json();
        return tool;
      })
    );
    const tools = toolsResult
      .map((result) => {
        return result.status === "fulfilled" ? result.value : null;
      })
      .filter((tool) => tool !== null);
    setActions(tools);
  }, []);

  useEffect(() => {
    fetchActions();
  }, [fetchActions]);

  return [actions, setActions] as const;
}

const fallbackWorkflows: Workflow[] = [];

function useWorkflows() {
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

export function ActionsProvider({ children }: { children: React.ReactNode }) {
  const [actions, setActions] = useActions();
  const [workflows, setWorkflows, newWorkflow] = useWorkflows();

  const dispatchers = useMemo(
    () => ({
      setActions,
      setWorkflows,
      newWorkflow,
    }),
    [setActions, setWorkflows, newWorkflow]
  );

  return (
    <ActionsContext.Provider value={{ actions, workflows }}>
      <SetActionsContext.Provider value={dispatchers}>
        {children}
      </SetActionsContext.Provider>
    </ActionsContext.Provider>
  );
}

export function useActionsState() {
  const { actions } = useContext(ActionsContext);
  const { setActions } = useContext(SetActionsContext);
  return [actions, setActions] as const;
}

export function useWorkflowsState() {
  const { workflows } = useContext(ActionsContext);
  const { setWorkflows, newWorkflow } = useContext(SetActionsContext);
  return { workflows, setWorkflows, newWorkflow } as const;
}
