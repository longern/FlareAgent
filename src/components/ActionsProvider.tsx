import { OpenAPIV3 } from "openapi-types";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const ActionsContext = createContext<OpenAPIV3.Document[] | null>(null);
const SetActionsContext = createContext<React.Dispatch<
  React.SetStateAction<OpenAPIV3.Document[] | null>
> | null>(null);

export function ActionsProvider({ children }: { children: React.ReactNode }) {
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

  return (
    <ActionsContext.Provider value={actions}>
      <SetActionsContext.Provider value={setActions}>
        {children}
      </SetActionsContext.Provider>
    </ActionsContext.Provider>
  );
}

export function useActionsState() {
  const actions = useContext(ActionsContext);
  const setActions = useContext(SetActionsContext);
  if (setActions === null) throw new Error("No actions setter provider");
  return [actions, setActions] as const;
}
