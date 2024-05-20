import React from "react";
import { Fab } from "@mui/material";
import {
  ArrowDownward as ArrowDownwardIcon,
  Stop as StopIcon,
} from "@mui/icons-material";

export function StopButton({
  onClick,
}: {
  onClick: React.MouseEventHandler<HTMLButtonElement>;
}) {
  return (
    <Fab
      size="small"
      sx={{
        position: "absolute",
        bottom: 16,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 1,
      }}
      onClick={onClick}
    >
      <StopIcon />
    </Fab>
  );
}

export function ScrollToBottomButton({
  onClick,
}: {
  onClick: React.MouseEventHandler<HTMLButtonElement>;
}) {
  return (
    <Fab
      size="small"
      sx={{
        position: "absolute",
        bottom: 16,
        right: 16,
        zIndex: 1,
      }}
      onClick={onClick}
    >
      <ArrowDownwardIcon />
    </Fab>
  );
}
