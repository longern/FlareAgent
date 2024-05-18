import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { Workflow } from "../workflow";

export const dialogsSlice = createSlice({
  name: "dialogs",
  initialState: {
    files: false,
    settings: false,
    signIn: false,
    tools: false,
    voiceCall: false,
    workflow: null as Workflow | null,
  },
  reducers: {
    showFiles(state) {
      state.files = true;
    },
    showSettings(state) {
      state.settings = true;
    },
    showSignIn(state) {
      state.signIn = true;
    },
    hideSignIn(state) {
      state.signIn = false;
    },
    showTools(state) {
      state.tools = true;
    },
    showVoiceCall(state) {
      state.voiceCall = true;
    },
    showWorkflow(state, action: PayloadAction<Workflow>) {
      state.workflow = action.payload;
    },
    hideFiles(state) {
      state.files = false;
    },
    hideSettings(state) {
      state.settings = false;
    },
    hideTools(state) {
      state.tools = false;
    },
    hideVoiceCall(state) {
      state.voiceCall = false;
    },
    hideWorkflow(state) {
      state.workflow = null;
    },
  },
});

export const {
  showFiles,
  hideFiles,
  showSignIn,
  hideSignIn,
  showSettings,
  hideSettings,
  showTools,
  hideTools,
  showVoiceCall,
  hideVoiceCall,
  showWorkflow,
  hideWorkflow,
} = dialogsSlice.actions;

export default dialogsSlice.reducer;
