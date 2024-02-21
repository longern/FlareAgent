import React, { useEffect } from "react";

import App from "./components/App";
import AppProvider from "./components/AppProvider";

if ("virtualKeyboard" in window.navigator) {
  (window.navigator as any).virtualKeyboard.overlaysContent = true;
}

function Root() {
  useEffect(() => {
    if (typeof window !== "undefined" && window.history.state !== null) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  return (
    <AppProvider>
      <App />
    </AppProvider>
  );
}

export default Root;
