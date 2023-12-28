import React from "react";
import {
  CssBaseline,
  GlobalStyles,
  ThemeProvider,
  createTheme,
} from "@mui/material";

import App from "./App";

const theme = createTheme();

const globalStyles = (
  <GlobalStyles
    styles={{
      "html, body, #root": {
        height: "100%",
      },
    }}
  />
);

function Root() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {globalStyles}
      <App />
    </ThemeProvider>
  );
}

export default Root;
