import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { readFile, writeFile } from "../fs/hooks";

async function handleSignParams() {
  if (typeof window === "undefined") return;
  const searchParams = new URLSearchParams(window.location.search);
  if (!searchParams.has("sign")) return;
  const cred = searchParams.get("sign");
  searchParams.delete("sign");
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}?${searchParams.toString()}`
  );
  const tokenResponse = await fetch("/api/auth/verify", {
    method: "POST",
    body: cred,
  });
  const tokenJson: { success: boolean } | { error: string } =
    await tokenResponse.json();
  if ("error" in tokenJson) return alert(tokenJson.error);
}

export const fetchIdentity = createAsyncThunk(
  "identity/fetchIdentity",
  async () => {
    await handleSignParams();
    const response = await fetch("/api/auth/identity");
    if (!response.ok) {
      throw new Error("Unauthorized");
    }
    return response.json<{ id: number }>();
  }
);

export const loadAvatar = createAsyncThunk<string | null, void>(
  "identity/loadAvatar",
  async () => {
    const file = await readFile("/root/.flareagent/avatar.png", {
      home: "/root",
    });
    const arrayBuffer = await file.arrayBuffer();
    const avatarFile = new File([arrayBuffer], file.name, { type: file.type });
    return URL.createObjectURL(avatarFile);
  }
);

export const setAvatar = createAsyncThunk<string | null, File | null>(
  "identity/setAvatar",
  async (avatar) => {
    try {
      await writeFile("/root/.flareagent/avatar.png", avatar, {
        home: "/root",
      });
      return URL.createObjectURL(avatar);
    } catch {
      return null;
    }
  }
);

const identitySlice = createSlice({
  name: "identity",
  initialState: {
    id: null,
    avatarUrl: null,
  },
  reducers: {},
  extraReducers(builder) {
    builder.addCase(fetchIdentity.fulfilled, (state, action) => {
      state.id = action.payload.id;
    });
    builder.addCase(loadAvatar.fulfilled, (state, action) => {
      state.avatarUrl = action.payload;
    });
    builder.addCase(setAvatar.fulfilled, (state, action) => {
      if (state.avatarUrl) {
        URL.revokeObjectURL(state.avatarUrl);
      }
      state.avatarUrl = action.payload;
    });
  },
});

export default identitySlice.reducer;
