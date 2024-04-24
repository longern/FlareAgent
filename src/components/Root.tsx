import React, { useEffect } from "react";

import { ActionsProvider } from "./ActionsProvider";
import { GlobalComponentsProvider } from "./global/GlobalComponents";
import App from "./App";

function useVirtualKeyboardOverlay() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (window.history.state !== null)
        window.history.replaceState(null, "", window.location.pathname);

      if ("virtualKeyboard" in window.navigator)
        (window.navigator as any).virtualKeyboard.overlaysContent = true;
    }
  }, []);
}

function Root() {
  useVirtualKeyboardOverlay();

  return (
    <ActionsProvider>
      <GlobalComponentsProvider>
        <App />
      </GlobalComponentsProvider>
    </ActionsProvider>
  );
}

export default Root;
