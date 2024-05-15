import { combineReducers, configureStore } from "@reduxjs/toolkit";

import abortReducer from "./abort";
import conversationsReducer from "./conversations";
import dialogsReducer from "./dialogs";
import errorReducer from "./error";
import identityReducer from "./identity";
import memoriesReducer from "./memories";
import modelsReducer from "./models";
import settingsReducer, { settingsMiddleware } from "./settings";
import conversationsMiddleware from "./conversationsMiddleware";
import memoriesMiddleware from "./memoriesMiddleware";
import { initializeApp } from "./init";

const reducers = combineReducers({
  abort: abortReducer,
  conversations: conversationsReducer,
  dialogs: dialogsReducer,
  error: errorReducer,
  identity: identityReducer,
  memories: memoriesReducer,
  models: modelsReducer,
  settings: settingsReducer,
});

const store = configureStore({
  reducer: reducers,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      conversationsMiddleware,
      memoriesMiddleware,
      settingsMiddleware
    ),
});

store.dispatch(initializeApp());

export type AppState = ReturnType<typeof reducers>;
export type AppDispatch = typeof store.dispatch;
export default store;
