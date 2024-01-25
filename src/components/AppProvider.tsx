import React from "react";
import { ErrorProvider } from "./ErrorDisplay";

function AppProvider({ children }: { children: React.ReactNode }) {
  return <ErrorProvider>{children}</ErrorProvider>;
}

export default AppProvider;
