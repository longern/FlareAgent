import React from "react";
import { ErrorProvider } from "./ErrorDisplay";
import { ActionsProvider } from "./ActionsProvider";
import { GlobalComponentsProvider } from "./global/GlobalComponents";

function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <ErrorProvider>
      <ActionsProvider>
        <GlobalComponentsProvider>{children}</GlobalComponentsProvider>
      </ActionsProvider>
    </ErrorProvider>
  );
}

export default AppProvider;
