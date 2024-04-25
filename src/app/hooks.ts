import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { AppDispatch, AppState } from "./store";
import { fetchIdentity } from "./identity";

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<AppState>();

export function useInitializeApp() {
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(fetchIdentity());
  }, [dispatch]);
}
