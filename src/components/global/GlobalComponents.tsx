import React, { createContext, useContext, useState } from "react";

import { Workflow } from "../../workflow";
import ToolsDialog from "./ToolsDialog";
import SettingsDialog from "./SettingsDialog";
import WorkflowDialog from "./WorkflowDialog";
import { ErrorDisplay } from "../ErrorDisplay";

const GlobalComponentsContext = createContext<{
  ToolsDialog: {
    open: () => void;
  };
  SettingsDialog: {
    open: () => void;
  };
  WorkflowDialog: {
    edit: (workflow: Workflow) => void;
  };
} | null>(null);

export function GlobalComponentsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [toolsDialogOpen, setToolsDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [workflowDialogEdit, setWorkflowDialogEdit] = useState<Workflow | null>(
    null
  );

  return (
    <GlobalComponentsContext.Provider
      value={{
        ToolsDialog: {
          open: () => setToolsDialogOpen(true),
        },
        SettingsDialog: {
          open: () => setSettingsDialogOpen(true),
        },
        WorkflowDialog: {
          edit: (workflow: Workflow) => {
            setWorkflowDialogEdit(workflow);
          },
        },
      }}
    >
      {children}
      <ToolsDialog
        open={toolsDialogOpen}
        onClose={() => setToolsDialogOpen(false)}
      />
      <SettingsDialog
        open={settingsDialogOpen}
        onClose={() => setSettingsDialogOpen(false)}
      />
      <WorkflowDialog
        workflow={workflowDialogEdit}
        onClose={() => setWorkflowDialogEdit(null)}
      />
      <ErrorDisplay />
    </GlobalComponentsContext.Provider>
  );
}

export function useGlobalComponents() {
  const globalComponents = useContext(GlobalComponentsContext);
  if (globalComponents === null)
    throw new Error("No global components provider");
  return globalComponents;
}
