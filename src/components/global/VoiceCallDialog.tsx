import { DialogContent, Fade } from "@mui/material";
import React from "react";
import { connect } from "react-redux";

import { hideVoiceCall } from "../../app/dialogs";
import { AppState } from "../../app/store";
import { HistoryDialog } from "./HistoryDialog";

function VoiceCallDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <HistoryDialog
      hash="voice-call"
      open={open}
      onClose={onClose}
      TransitionComponent={Fade}
    >
      <DialogContent sx={{ padding: 2 }}></DialogContent>
    </HistoryDialog>
  );
}

export default connect(
  (state: AppState) => ({
    open: state.dialogs.voiceCall,
  }),
  (dispatch) => ({
    onClose: () => dispatch(hideVoiceCall()),
  })
)(VoiceCallDialog);
