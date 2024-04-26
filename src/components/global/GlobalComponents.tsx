import React, { Suspense, useEffect, useMemo } from "react";
import {
  CssBaseline,
  GlobalStyles,
  Snackbar,
  ThemeProvider,
  createTheme,
  useMediaQuery,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { connect, useSelector } from "react-redux";

import { AppState } from "../../app/store";
import { hideError } from "../../app/error";

const FilesDialog = React.lazy(() => import("./FilesDialog"));
const SettingsDialog = React.lazy(() => import("./SettingsDialog"));
const ToolsDialog = React.lazy(() => import("./ToolsDialog"));
const WorkflowDialog = React.lazy(() => import("./WorkflowDialog"));

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

const ErrorDisplay = connect(
  (state: AppState) => ({
    color: "error",
    open: state.error.message !== null,
    message: state.error.message,
  }),
  (dispatch) => ({
    onClose: () => dispatch(hideError()),
  })
)(Snackbar);

export function GlobalComponentsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const darkMode = useSelector((state: AppState) => state.settings.darkMode);
  const language = useSelector((state: AppState) => state.settings.language);
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const { i18n } = useTranslation();

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode:
            darkMode !== undefined
              ? darkMode
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
    [darkMode, prefersDarkMode]
  );

  useEffect(() => {
    i18n.changeLanguage(language);
  }, [i18n, language]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {globalStyles}
      {children}
      <Suspense>
        <FilesDialog />
      </Suspense>
      <Suspense>
        <ToolsDialog />
      </Suspense>
      <Suspense>
        <SettingsDialog />
      </Suspense>
      <Suspense>
        <WorkflowDialog />
      </Suspense>
      <ErrorDisplay />
    </ThemeProvider>
  );
}
