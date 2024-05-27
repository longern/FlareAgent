import {
  Avatar,
  Box,
  Drawer,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  Theme,
  useMediaQuery,
} from "@mui/material";
import React, { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";

import { abort } from "../../app/abort";
import { setCurrentConversation } from "../../app/conversations";
import { showSettings } from "../../app/dialogs";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { setAvatar } from "../../app/identity";
import { fetchModels, setModel } from "../../app/models";
import { SparseList } from "../global/SparseList";
import ConversationList from "./ConversationList";

function useUpdateModels() {
  const userId = useAppSelector((state) => state.identity.id);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!userId) return;
    dispatch(fetchModels());
  }, [dispatch, userId]);
}

export function ModelSelector() {
  const models = useAppSelector((state) => state.models.models);
  const model = useAppSelector((state) => state.models.model);
  const dispatch = useAppDispatch();

  useUpdateModels();

  return (
    <Select
      variant="standard"
      value={model}
      onChange={(e) => {
        dispatch(setModel(e.target.value));
      }}
      inputProps={{ "aria-label": "model" }}
    >
      {models ? (
        models.map((model) => (
          <MenuItem key={model} value={model}>
            {model}
          </MenuItem>
        ))
      ) : (
        <MenuItem value={model}>{model}</MenuItem>
      )}
    </Select>
  );
}

export const modelSelector = <ModelSelector />;

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const avatarUrl = useAppSelector((state) => state.identity.avatarUrl);
  const userId = useAppSelector((state) => state.identity.id);
  const matchesLg = useMediaQuery((theme: Theme) => theme.breakpoints.up("lg"));
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const handleNewChat = useCallback(() => {
    dispatch(setCurrentConversation(null));
    dispatch(abort());
    onClose();
  }, [dispatch, onClose]);

  return (
    <Drawer
      variant={matchesLg ? "permanent" : "temporary"}
      open={open}
      anchor="left"
      sx={{
        [`& .MuiDrawer-paper`]: {
          width: "320px",
          position: matchesLg ? "relative" : "fixed",
        },
      }}
      onClose={onClose}
    >
      <Stack height="100%">
        {matchesLg && (
          <Stack sx={{ px: 2, py: 1.5, justifyContent: "center" }}>
            {modelSelector}
          </Stack>
        )}
        <Stack
          direction="row"
          spacing={2}
          sx={{ padding: 2, alignItems: "center" }}
        >
          <IconButton component="label" sx={{ p: 0 }}>
            <Avatar src={avatarUrl} sx={{ width: 64, height: 64 }} />
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(event) => {
                if (!event.target.files) return;
                dispatch(setAvatar(event.target.files[0]));
                event.target.value = "";
              }}
            />
          </IconButton>
          <Box
            sx={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}
          >
            {userId}
          </Box>
        </Stack>
        <ListItemButton
          onClick={handleNewChat}
          sx={{ flexGrow: 0, minHeight: 60 }}
        >
          <ListItemText primary={t("New chat")} />
        </ListItemButton>
        <Box sx={{ flexGrow: 1, minHeight: 0, overflowY: "auto" }}>
          <ConversationList onClose={onClose} />
        </Box>
        <SparseList disablePadding>
          <ListItem disablePadding>
            <ListItemButton onClick={() => dispatch(showSettings())}>
              <ListItemText primary={t("Settings")} />
            </ListItemButton>
          </ListItem>
        </SparseList>
      </Stack>
    </Drawer>
  );
}

export default Sidebar;
