import React, { createContext, useCallback, useContext, useState } from "react";

import { Workflow } from "../../workflow";
import ToolsDialog from "./ToolsDialog";
import SettingsDialog from "./SettingsDialog";
import WorkflowDialog from "./WorkflowDialog";
import { ErrorDisplay } from "../ErrorDisplay";
import FilesDialog from "./FilesDialog";

const GlobalComponentsContext = createContext<{
  FilesDialog: {
    open: () => void;
  };
  SettingsDialog: {
    open: () => void;
  };
  ToolsDialog: {
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
  const [filesDialogOpen, setFilesDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [toolsDialogOpen, setToolsDialogOpen] = useState(false);
  const [workflowDialogEdit, setWorkflowDialogEdit] = useState<Workflow | null>(
    null
  );

  const closeFilesDialog = useCallback(() => setFilesDialogOpen(false), []);
  const closeSettingsDialog = useCallback(
    () => setSettingsDialogOpen(false),
    []
  );

  return (
    <GlobalComponentsContext.Provider
      value={{
        FilesDialog: {
          open: () => setFilesDialogOpen(true),
        },
        SettingsDialog: {
          open: () => setSettingsDialogOpen(true),
        },
        ToolsDialog: {
          open: () => setToolsDialogOpen(true),
        },
        WorkflowDialog: {
          edit: (workflow: Workflow) => {
            setWorkflowDialogEdit(workflow);
          },
        },
      }}
    >
      {children}
      <FilesDialog open={filesDialogOpen} onClose={closeFilesDialog} />
      <ToolsDialog
        open={toolsDialogOpen}
        onClose={() => setToolsDialogOpen(false)}
      />
      <SettingsDialog open={settingsDialogOpen} onClose={closeSettingsDialog} />
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
