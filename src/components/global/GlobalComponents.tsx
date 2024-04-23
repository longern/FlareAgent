import React, {
  Suspense,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  CssBaseline,
  GlobalStyles,
  ThemeProvider,
  createTheme,
  useMediaQuery,
} from "@mui/material";
import { useTranslation } from "react-i18next";

import { Workflow } from "../../workflow";
import { ErrorDisplay } from "../ErrorDisplay";
import { useSettings } from "../ActionsProvider";

const FilesDialog = React.lazy(() => import("./FilesDialog"));
const SettingsDialog = React.lazy(() => import("./SettingsDialog"));
const ToolsDialog = React.lazy(() => import("./ToolsDialog"));
const WorkflowDialog = React.lazy(() => import("./WorkflowDialog"));

async function handleSignParams() {
  if (typeof window === "undefined") return;
  const searchParams = new URLSearchParams(window.location.search);
  if (!searchParams.has("sign")) return;
  const cred = searchParams.get("sign");
  searchParams.delete("sign");
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}?${searchParams.toString()}`
  );
  const tokenResponse = await fetch("/auth/verify", {
    method: "POST",
    body: cred,
  });
  const tokenJson: { token: string } | { error: string } =
    await tokenResponse.json();
  if ("error" in tokenJson) return alert(tokenJson.error);
  const { token } = tokenJson;
  localStorage.setItem("OPENAI_API_KEY", token);
}

handleSignParams();

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
        <Suspense>
          <FilesDialog
            open={filesDialogOpen}
            onClose={() => setFilesDialogOpen(false)}
          />
        </Suspense>
        <Suspense>
          <ToolsDialog
            open={toolsDialogOpen}
            onClose={() => setToolsDialogOpen(false)}
          />
        </Suspense>
        <Suspense>
          <SettingsDialog
            open={settingsDialogOpen}
            onClose={() => setSettingsDialogOpen(false)}
          />
        </Suspense>
        <Suspense>
          <WorkflowDialog
            workflow={workflowDialogEdit}
            onClose={() => setWorkflowDialogEdit(null)}
          />
        </Suspense>
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
