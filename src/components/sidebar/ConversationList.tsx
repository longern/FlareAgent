import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { MoreHoriz as MoreHorizIcon } from "@mui/icons-material";
import {
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
} from "@mui/material";

import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  archiveConversation,
  removeConversation,
  setCurrentConversation,
} from "../../app/conversations";

function ConversationList({ onClose }: { onClose: () => void }) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const conversations = useAppSelector(
    (state) => state.conversations.conversations
  );
  const currentConversationId = useAppSelector(
    (state) => state.conversations.currentConversationId
  );
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  return (
    <React.Fragment>
      <List disablePadding sx={{ flexGrow: 1 }}>
        {Object.values(conversations).map((conversation) => (
          <ListItem
            key={conversation.id}
            disablePadding
            disableGutters
            secondaryAction={
              <IconButton
                aria-label="More"
                onClick={(event) => {
                  setAnchorEl(event.currentTarget);
                  setMenuId(conversation.id);
                }}
              >
                <MoreHorizIcon />
              </IconButton>
            }
          >
            <ListItemButton
              selected={conversation.id === currentConversationId}
              onClick={() => {
                dispatch(setCurrentConversation(conversation.id));
                onClose();
              }}
            >
              <ListItemText primary={conversation.title} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => {
          setAnchorEl(null);
          setMenuId(null);
        }}
        MenuListProps={{ sx: { minWidth: "160px" } }}
      >
        <MenuItem
          onClick={() => {
            dispatch(setCurrentConversation(menuId));
            setAnchorEl(null);
            setMenuId(null);
          }}
        >
          {t("Active")}
        </MenuItem>
        <MenuItem
          onClick={() => {
            archiveConversation(conversations[menuId]);
            setAnchorEl(null);
            setMenuId(null);
          }}
        >
          {t("Archive")}
        </MenuItem>
        <MenuItem>{t("Rename")}</MenuItem>
        <Divider component="li" />
        <MenuItem
          onClick={() => {
            dispatch(removeConversation(menuId));
            setAnchorEl(null);
            setMenuId(null);
          }}
        >
          {t("Delete")}
        </MenuItem>
      </Menu>
    </React.Fragment>
  );
}

export default ConversationList;
