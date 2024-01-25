import React from "react";
import { ErrorProvider } from "./ErrorDisplay";
import { ActionsProvider } from "./ActionsProvider";

function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <ErrorProvider>
      <ActionsProvider>{children}</ActionsProvider>
    </ErrorProvider>
  );
}

export default AppProvider;
