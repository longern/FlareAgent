import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

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

const identitySlice = createSlice({
  name: "identity",
  initialState: {
    id: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchIdentity.fulfilled, (state, action) => {
      state.id = action.payload.id;
    });
  },
});

export default identitySlice.reducer;
