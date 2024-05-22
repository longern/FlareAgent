import React from "react";
import { Box, IconButton, Toolbar } from "@mui/material";
import {
  AddComment as AddCommentIcon,
  Menu as MenuIcon,
} from "@mui/icons-material";

import { modelSelector } from "./Sidebar";

function MobileToolbar({
  onMenuClick,
  onCreateThread,
}: {
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
