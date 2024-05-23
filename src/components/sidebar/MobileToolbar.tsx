import {
  AddComment as AddCommentIcon,
  Menu as MenuIcon,
} from "@mui/icons-material";
import { Box, IconButton, Toolbar } from "@mui/material";
import React from "react";

import { abort } from "../../app/abort";
import { setCurrentConversation } from "../../app/conversations";
import { useAppDispatch } from "../../app/hooks";
import { modelSelector } from "./Sidebar";

function MobileToolbar({ onMenuClick }: { onMenuClick: () => void }) {
  const dispatch = useAppDispatch();
  const handleNewConversation = () => {
    dispatch(setCurrentConversation(null));
    dispatch(abort());
  };

  return (
    <Toolbar
      disableGutters
      sx={{ flexShrink: 0, borderBottom: "1px solid #ddd" }}
    >
      <IconButton size="large" aria-label="open sidebar" onClick={onMenuClick}>
        <MenuIcon />
      </IconButton>
      <Box sx={{ flexGrow: 1, textAlign: "center" }}>{modelSelector}</Box>
      <IconButton
        size="large"
        aria-label="New conversation"
        onClick={handleNewConversation}
      >
        <AddCommentIcon />
      </IconButton>
    </Toolbar>
  );
}

export default MobileToolbar;
