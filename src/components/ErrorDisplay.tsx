import { Snackbar } from "@mui/material";
import React, { createContext, useContext, useState } from "react";

const ErrorContext = createContext<string | null>(null);
const SetErrorContext = createContext<React.Dispatch<
  React.SetStateAction<string | null>
> | null>(null);

export function ErrorProvider({ children }: { children: React.ReactNode }) {
  const [error, setError] = useState<string | null>(null);

  return (
    <ErrorContext.Provider value={error}>
      <SetErrorContext.Provider value={setError}>
        {children}
      </SetErrorContext.Provider>
    </ErrorContext.Provider>
  );
}

export function useSetError() {
  const setError = useContext(SetErrorContext);
  if (setError === null) throw new Error("No error setter provider");
  return setError;
}

export function ErrorDisplay() {
  const error = useContext(ErrorContext);
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
