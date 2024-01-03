import React from "react";
import { IconButton, Toolbar } from "@mui/material";
import {
  AddComment as AddCommentIcon,
  Menu as MenuIcon,
} from "@mui/icons-material";
import { Box } from "@mui/system";

function MobileToolbar({
  modelSelector,
  onMenuClick,
  onCreateThread,
}: {
  modelSelector: React.ReactNode;
  onMenuClick: () => void;
  onCreateThread: () => void;
}) {
  return (
    <Toolbar
      disableGutters
      sx={{ flexShrink: 0, borderBottom: "1px solid #ddd" }}
    >
      <IconButton size="large" aria-label="menu" onClick={onMenuClick}>
        <MenuIcon />
      </IconButton>
      <Box sx={{ flexGrow: 1, textAlign: "center" }}>{modelSelector}</Box>
      <IconButton
        size="large"
        aria-label="create thread"
        onClick={onCreateThread}
      >
        <AddCommentIcon />
      </IconButton>
    </Toolbar>
  );
}

export default MobileToolbar;
