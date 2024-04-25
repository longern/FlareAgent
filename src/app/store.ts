import { configureStore } from "@reduxjs/toolkit";

import dialogsReducer from "./dialogs";
import errorReducer from "./error";
import identityReducer from "./identity";

const store = configureStore({
  reducer: {
    error: errorReducer,
    dialogs: dialogsReducer,
    identity: identityReducer,
  },
});

export type AppState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;
