import { createAsyncThunk } from "@reduxjs/toolkit";

import { showSignIn } from "./dialogs";
import { fetchIdentity, loadAvatar } from "./identity";
import { fetchModels } from "./models";

export const initializeApp = createAsyncThunk(
  "app/initializeApp",
  async (_: undefined, { dispatch }) => {
    dispatch(fetchIdentity()).then((action) => {
      if (
        action.meta.requestStatus === "rejected" &&
        !window.localStorage.getItem("OPENAI_API_KEY")
      )
        dispatch(showSignIn());
    });
    dispatch(loadAvatar());
    dispatch(fetchModels());
  }
);
