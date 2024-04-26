import { useCallback, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import { AppDispatch, AppState } from "./store";
import { fetchIdentity, loadAvatar } from "./identity";
import { useSyncFS } from "../fs/hooks";
import { Settings, initializeSettings } from "./settings";

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<AppState>();

export function useSyncSettings() {
  const dispatch = useAppDispatch();
  const value = useAppSelector((state) => state.settings);

  const setValue = useCallback(
    (settings: Settings) => {
      dispatch(initializeSettings(settings));
    },
    [dispatch]
  );

  const fallbackValue = useMemo(() => ({}), []);

  useSyncFS({
    path: "/root/.flareagent/settings.json",
    value,
    setValue,
    fallbackValue,
  });
}

export function useInitializeApp() {
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(fetchIdentity());
    dispatch(loadAvatar());
  }, [dispatch]);
  useSyncSettings();
}
