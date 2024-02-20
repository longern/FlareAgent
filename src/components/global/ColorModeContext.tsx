import { createContext, useContext } from "react";

const ColorModeContext = createContext<(mode: "light" | "dark" | null) => void>(
  () => {}
);

export function useColorMode() {
  return useContext(ColorModeContext);
}

export const ColorModeProvider = ColorModeContext.Provider;
