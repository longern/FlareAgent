import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { Workflow } from "../workflow";
import { useTranslation } from "react-i18next";
import { useSyncFS } from "../fs/hooks";

const ActionsContext = createContext<{
  workflows: Workflow[] | null;
} | null>(null);
const SetActionsContext = createContext<{
  setWorkflows: React.Dispatch<React.SetStateAction<Workflow[] | null>>;
  newWorkflow: () => void;
} | null>(null);

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
  const [workflows, setWorkflows, newWorkflow] = useWorkflows();

  const dispatchers = useMemo(
    () => ({
      setWorkflows,
      newWorkflow,
    }),
    [setWorkflows, newWorkflow]
  );

  return (
    <ActionsContext.Provider value={{ workflows }}>
      <SetActionsContext.Provider value={dispatchers}>
        {children}
      </SetActionsContext.Provider>
    </ActionsContext.Provider>
  );
}

export function useWorkflowsState() {
  const { workflows } = useContext(ActionsContext);
  const { setWorkflows, newWorkflow } = useContext(SetActionsContext);
  return { workflows, setWorkflows, newWorkflow } as const;
}
