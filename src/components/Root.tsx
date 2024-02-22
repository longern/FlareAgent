import React, { useEffect } from "react";

import { ErrorProvider } from "./ErrorDisplay";
import { ActionsProvider } from "./ActionsProvider";
import { GlobalComponentsProvider } from "./global/GlobalComponents";
import App from "./App";

function Root() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (window.history.state !== null)
        window.history.replaceState(null, "", window.location.pathname);

      if ("virtualKeyboard" in window.navigator)
        (window.navigator as any).virtualKeyboard.overlaysContent = true;
    }
  }, []);

  return (
    <ErrorProvider>
      <ActionsProvider>
        <GlobalComponentsProvider>
          <App />
        </GlobalComponentsProvider>
      </ActionsProvider>
    </ErrorProvider>
  );
}

export default Root;
