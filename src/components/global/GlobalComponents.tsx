import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { Workflow } from "../../workflow";
import ToolsDialog from "./ToolsDialog";
import SettingsDialog from "./SettingsDialog";
import WorkflowDialog from "./WorkflowDialog";
import { ErrorDisplay } from "../ErrorDisplay";
import FilesDialog from "./FilesDialog";
import { useSettings } from "../ActionsProvider";
import {
  CssBaseline,
  GlobalStyles,
  ThemeProvider,
  createTheme,
  useMediaQuery,
} from "@mui/material";
import { useTranslation } from "react-i18next";

const globalStyles = (
  <GlobalStyles
    styles={{
      html: {
        position: "relative",
        height: "calc(100% - env(keyboard-inset-height, 0px))",
        transition: "height 0.2s",
      },

      "body, #root": {
        height: "100%",
      },

      code: {
        fontFamily: 'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
      },
    }}
  />
);

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
  const settings = useSettings() ?? {};
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const { i18n } = useTranslation();

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode:
            settings.darkMode !== undefined
              ? settings.darkMode
              : prefersDarkMode
              ? "dark"
              : "light",
        },
        typography: {
          button: {
            textTransform: "none",
          },
        },
      }),
    [settings.darkMode, prefersDarkMode]
  );

  const closeFilesDialog = useCallback(() => setFilesDialogOpen(false), []);
  const closeSettingsDialog = useCallback(
    () => setSettingsDialogOpen(false),
    []
  );

  useEffect(() => {
    i18n.changeLanguage(settings.language);
  }, [i18n, settings.language]);

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
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {globalStyles}
        {children}
        <FilesDialog open={filesDialogOpen} onClose={closeFilesDialog} />
        <ToolsDialog
          open={toolsDialogOpen}
          onClose={() => setToolsDialogOpen(false)}
        />
        <SettingsDialog
          open={settingsDialogOpen}
          onClose={closeSettingsDialog}
        />
        <WorkflowDialog
          workflow={workflowDialogEdit}
          onClose={() => setWorkflowDialogEdit(null)}
        />
        <ErrorDisplay />
      </ThemeProvider>
    </GlobalComponentsContext.Provider>
  );
}

export function useGlobalComponents() {
  const globalComponents = useContext(GlobalComponentsContext);
  if (globalComponents === null)
    throw new Error("No global components provider");
  return globalComponents;
}
