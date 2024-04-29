import { configureStore } from "@reduxjs/toolkit";

import conversationsReducer from "./conversations";
import dialogsReducer from "./dialogs";
import errorReducer from "./error";
import identityReducer from "./identity";
import modelsReducer from "./models";
import settingsReducer from "./settings";

const store = configureStore({
  reducer: {
    conversations: conversationsReducer,
    dialogs: dialogsReducer,
    error: errorReducer,
    identity: identityReducer,
    models: modelsReducer,
    settings: settingsReducer,
  },
});

export type AppState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;
