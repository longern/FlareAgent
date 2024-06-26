import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { MoreHoriz as MoreHorizIcon } from "@mui/icons-material";
import {
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListSubheader,
  Menu,
  MenuItem,
} from "@mui/material";

import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  archiveConversation,
  removeConversation,
  setCurrentConversation,
  updateConversationTitle,
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

  const closeMenu = useCallback(() => {
    setAnchorEl(null);
    setMenuId(null);
  }, []);

  return (
    <React.Fragment>
      <List disablePadding sx={{ flexGrow: 1 }}>
        <ListSubheader sx={{ marginTop: 1, lineHeight: "32px" }}>
          {t("Chat history")}
        </ListSubheader>
        {conversations === null ? (
          <ListItem>
            <ListItemText primary={t("Loading...")} />
          </ListItem>
        ) : (
          Object.values(conversations).map((conversation) => (
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
          ))
        )}
      </List>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={closeMenu}
        MenuListProps={{ sx: { minWidth: "160px" } }}
      >
        <MenuItem
          onClick={() => {
            dispatch(setCurrentConversation(menuId));
            closeMenu();
          }}
        >
          {t("Active")}
        </MenuItem>
        <MenuItem
          onClick={() => {
            archiveConversation(conversations[menuId]);
            closeMenu();
          }}
        >
          {t("Archive")}
        </MenuItem>
        <MenuItem
          onClick={() => {
            closeMenu();
            setTimeout(() => {
              const newTitle = window.prompt(
                t("Enter new title"),
                conversations[menuId].title
              );
              if (!newTitle) return;
              dispatch(
                updateConversationTitle({ id: menuId, title: newTitle })
              );
            }, 0);
          }}
        >
          {t("Rename")}
        </MenuItem>
        <Divider component="li" />
        <MenuItem
          onClick={() => {
            dispatch(removeConversation(menuId));
            closeMenu();
          }}
        >
          {t("Delete")}
        </MenuItem>
      </Menu>
    </React.Fragment>
  );
}

export default ConversationList;
