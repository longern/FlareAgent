import React from "react";
import { IconButton, MenuItem, Select, Toolbar } from "@mui/material";
import {
  AddComment as AddCommentIcon,
  Menu as MenuIcon,
} from "@mui/icons-material";
import { Box } from "@mui/system";

function MobileToolbar({
  models,
  modelValue,
  onMenuClick,
  onModelChange,
  onCreateThread,
}: {
  models: string[];
  modelValue: string;
  onMenuClick: () => void;
  onModelChange: (model: string) => void;
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
      <Box sx={{ flexGrow: 1, textAlign: "center" }}>
        <Select
          variant="standard"
          value={modelValue}
          onChange={(e) => {
            onModelChange(e.target.value);
          }}
        >
          {models.map((model) => (
            <MenuItem key={model} value={model}>
              {model}
            </MenuItem>
          ))}
        </Select>
      </Box>
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
