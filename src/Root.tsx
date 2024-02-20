import React, { useEffect, useMemo } from "react";
import {
  CssBaseline,
  GlobalStyles,
  ThemeProvider,
  createTheme,
  useMediaQuery,
} from "@mui/material";

import App from "./components/App";
import AppProvider from "./components/AppProvider";
import { ColorModeProvider } from "./components/global/ColorModeContext";

const globalStyles = (
  <GlobalStyles
    styles={{
      "html, body, #root": {
        height: "100%",
      },

      code: {
        fontFamily: 'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
      },
    }}
  />
);

function Root() {
  const [colorMode, setColorMode] = React.useState<"light" | "dark" | null>(
    null
  );
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode:
            colorMode !== null ? colorMode : prefersDarkMode ? "dark" : "light",
        },
      }),
    [colorMode, prefersDarkMode]
  );

  useEffect(() => {
    if (typeof window !== "undefined" && window.history.state !== null) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  return (
    <ColorModeProvider value={setColorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {globalStyles}
        <AppProvider>
          <App />
        </AppProvider>
      </ThemeProvider>
    </ColorModeProvider>
  );
}

export default Root;
