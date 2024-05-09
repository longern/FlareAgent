import React from "react";

import { ActionsProvider } from "./ActionsProvider";
import { GlobalComponentsProvider } from "./global/GlobalComponents";
import App from "./App";

function Root() {
  return (
    <ActionsProvider>
      <GlobalComponentsProvider>
        <App />
      </GlobalComponentsProvider>
    </ActionsProvider>
  );
}

export default Root;
