import { configureStore } from "@reduxjs/toolkit";

import dialogsReducer from "./dialogs";
import errorReducer from "./error";

const store = configureStore({
  reducer: {
    error: errorReducer,
    dialogs: dialogsReducer,
  },
});

export type AppState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;
