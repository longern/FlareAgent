import { Snackbar } from "@mui/material";
import React from "react";

const errorContext = React.createContext<string | null>(null);
const setErrorContext = React.createContext<React.Dispatch<
  React.SetStateAction<string | null>
> | null>(null);

export function ErrorProvider({ children }: { children: React.ReactNode }) {
  const [error, setError] = React.useState<string | null>(null);

  return (
    <errorContext.Provider value={error}>
      <setErrorContext.Provider value={setError}>
        {children}
      </setErrorContext.Provider>
    </errorContext.Provider>
  );
}

export function useSetError() {
  const setError = React.useContext(setErrorContext);
  if (setError === null) throw new Error("No error setter provider");
  return setError;
}

export function ErrorDisplay() {
  const error = React.useContext(errorContext);
  const setError = useSetError();

  return (
    <Snackbar
      color="error"
      open={error !== null}
      onClose={() => setError(null)}
      message={error}
    />
  );
}
