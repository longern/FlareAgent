import { useCallback, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import { AppDispatch, AppState } from "./store";
import { fetchIdentity, loadAvatar } from "./identity";
import { useSyncFS } from "../fs/hooks";
import { Settings, initializeSettings } from "./settings";
import OpenAI from "openai";
import { setModels } from "./models";

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<AppState>();

export function useModels() {
  const userId = useAppSelector((state) => state.identity.id);
  const dispatch = useAppDispatch();

  const fetchModels = useCallback(async () => {
    const openaiApiKey = localStorage.getItem("OPENAI_API_KEY") ?? "";
    const baseURL = localStorage.getItem("OPENAI_BASE_URL");
    if (!userId && !openaiApiKey) return;
    const openai = new OpenAI({
      apiKey: openaiApiKey,
      baseURL,
      dangerouslyAllowBrowser: true,
    });
    const models = await openai.models.list();
    const filteredModelIds = models.data
      .filter(
        (model) =>
          model.owned_by === "system" &&
          ((model.id.startsWith("gpt-") && !model.id.includes("instruct")) ||
            model.id.startsWith("llama-") ||
            model.id.startsWith("qwen"))
      )
      .map((model) => model.id);
    dispatch(setModels(filteredModelIds));
  }, [dispatch, userId]);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);
}

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
  useModels();
  useSyncSettings();
}
