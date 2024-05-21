import {
  Build as BuildIcon,
  CancelOutlined as CancelOutlinedIcon,
  CheckBoxOutlined as CheckBoxOutlinedIcon,
  ContentCopy as ContentCopyIcon,
  Menu as MenuIcon,
  Person as PersonIcon,
  Replay as ReplayIcon,
  SelectAll,
  Share as ShareIcon,
  SmartToy as SmartToyIcon,
  VolumeUp as VolumeUpIcon,
} from "@mui/icons-material";
import {
  Avatar,
  Box,
  Card,
  Checkbox,
  CircularProgress,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Slide,
  Stack,
} from "@mui/material";
import "katex/dist/katex.min.css";
import { ChatCompletionMessageParam } from "openai/resources/index";
import React, { Suspense, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { connect } from "react-redux";

import { useAppSelector } from "../../app/hooks";
import { AppState } from "../../app/store";
import { MarkdownHighlighter } from "./Highlighter";
import {
  ChatCompletionContent,
  ChatCompletionExecutionOutput,
} from "../../app/conversations/thunks";
import {
  AssistantToolCallMessasge,
  ToolExecutionOutputMessage,
} from "./ToolCallMessage";
import { Message } from "../../app/conversations";

function MessageListItemContent({
  message,
}: {
  message: ChatCompletionMessageParam;
}) {
  const content: ChatCompletionContent = message.content;

  return message.role === "tool" ? (
    <ToolExecutionOutputMessage
      content={content[0] as ChatCompletionExecutionOutput}
    />
  ) : typeof content === "string" ? (
    message.role === "assistant" ? (
      <Suspense fallback={content}>
        <MarkdownHighlighter>{content}</MarkdownHighlighter>
      </Suspense>
    ) : (
      <p>{content}</p>
    )
  ) : (
    content.map((part, index) =>
      part.type === "text" ? (
        <span key={index}>{part.text}</span>
      ) : part.type === "image_url" ? (
        <img key={index} src={part.image_url.url} alt="" />
      ) : part.type === "function" ? (
        <AssistantToolCallMessasge key={part.id} tool_call={part} />
      ) : null
    )
  );
}

function MessageAvatar({ role }: { role: string }) {
  const avatarUrl = useAppSelector((state) => state.identity.avatarUrl);

  return role === "system" ? (
    <Avatar>S</Avatar>
  ) : role === "user" ? (
    <Avatar
      src={avatarUrl}
      sx={{ backgroundColor: (theme) => theme.palette.background.paper }}
    >
      <PersonIcon />
    </Avatar>
  ) : role === "assistant" ? (
    <Avatar sx={{ backgroundColor: "#19c37d" }}>
      <SmartToyIcon />
    </Avatar>
  ) : role === "tool" ? (
    <Avatar>
      <BuildIcon />
    </Avatar>
  ) : (
    <Avatar>?</Avatar>
  );
}

function MessageListItem({
  message,
  multiSelecting,
  onMultiSelectingChange,
  selected,
  onSelect,
}: {
  message: Message;
  multiSelecting: boolean;
  onMultiSelectingChange: (multiSelecting: boolean) => void;
  selected: boolean;
  onSelect: (selected: boolean) => void;
}) {
  const [contextMenu, setContextMenu] = React.useState<{
    mouseX: number;
    mouseY: number;
  } | null>(null);
  const [disableContextMenu, setDisableContextMenu] = useState(false);

  const { t } = useTranslation();

  const content = useMemo(() => {
    const messageParam = {
      role: message.author_role,
      content: JSON.parse(message.content),
    } as ChatCompletionMessageParam;
    return <MessageListItemContent message={messageParam} />;
  }, [message]);

  const handleContextMenu = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (disableContextMenu) return;
      event.preventDefault();
      setContextMenu((contextMenu) =>
        contextMenu === null
          ? { mouseX: event.clientX, mouseY: event.clientY }
          : null
      );
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(event.currentTarget);
      selection?.removeAllRanges();
      selection?.addRange(range);
    },
    [disableContextMenu]
  );

  const handleCopyToClipboard = useCallback(async () => {
    const content: ChatCompletionContent = JSON.parse(message.content);
    if (typeof content === "string") {
      await navigator.clipboard.writeText(content);
    } else {
      const items = await Promise.all(
        content.map(async (part) => {
          if (part.type === "text") {
            return new ClipboardItem({
              "text/plain": new Blob([part.text], {
                type: "text/plain",
              }),
            });
          } else if (part.type === "image_url") {
            const response = await fetch(part.image_url.url);
            const blob = await response.blob();
            return new ClipboardItem({ [blob.type]: blob });
          } else if (part.type === "execution_output") {
            return new ClipboardItem({
              "text/plain": new Blob([part.output], {
                type: "text/plain",
              }),
            });
          }
          return new ClipboardItem({});
        })
      );
      await navigator.clipboard.write(items);
    }
    const selection = window.getSelection();
    selection?.removeAllRanges();
    setContextMenu(null);
  }, [message.content]);

  const messageBox = (
    <Box
      sx={{
        minWidth: 0,
        overflow: "auto",
        overflowWrap: "break-word",
        padding: "0.5em 0.8em",
        borderRadius: "14px",
        backgroundColor: (theme) =>
          message.author_role === "user"
            ? theme.palette.primary.main
            : theme.palette.background.paper,
        color: (theme) =>
          message.author_role === "user"
            ? theme.palette.primary.contrastText
            : theme.palette.text.primary,
        overflowX: "auto",
        "& img": { display: "block", maxWidth: "100%", maxHeight: "60vh" },
        "& p": { marginY: 1 },
        "& pre": { margin: 0 },
        "& pre>code": { whiteSpace: "pre-wrap" },
      }}
      onContextMenu={handleContextMenu}
    >
      {content}
    </Box>
  );

  const messageMenu = (
    <Menu
      open={contextMenu !== null}
      onClose={() => setContextMenu(null)}
      anchorReference="anchorPosition"
      anchorPosition={
        contextMenu !== null
          ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
          : undefined
      }
    >
      <MenuItem>
        <ListItemIcon>
          <VolumeUpIcon />
        </ListItemIcon>
        <ListItemText>{t("Read aloud")}</ListItemText>
      </MenuItem>
      <MenuItem onClick={handleCopyToClipboard}>
        <ListItemIcon>
          <ContentCopyIcon />
        </ListItemIcon>
        <ListItemText>{t("Copy")}</ListItemText>
      </MenuItem>
      <MenuItem>
        <ListItemIcon>
          <ReplayIcon />
        </ListItemIcon>
        <ListItemText>{t("Retry")}</ListItemText>
      </MenuItem>
      <MenuItem
        onClick={() => {
          onMultiSelectingChange(true);
          onSelect(true);
          setContextMenu(null);
          const selection = window.getSelection();
          selection?.removeAllRanges();
        }}
      >
        <ListItemIcon>
          <CheckBoxOutlinedIcon />
        </ListItemIcon>
        <ListItemText>{t("Multi-select")}</ListItemText>
      </MenuItem>
      <MenuItem
        onClick={() => {
          setDisableContextMenu(true);
          setContextMenu(null);
          setTimeout(() => setDisableContextMenu(false), 60000);
        }}
      >
        <ListItemIcon>
          <MenuIcon />
        </ListItemIcon>
        <ListItemText>{t("Native menu")}</ListItemText>
      </MenuItem>
    </Menu>
  );

  return (
    <Stack
      direction="row"
      spacing={1}
      className={selected ? "" : "screenshot-hidden"}
      onClickCapture={(event) => {
        if (!multiSelecting) return;
        event.stopPropagation();
        onSelect(!selected);
      }}
    >
      {multiSelecting && (
        <Checkbox
          checked={selected}
          onChange={(event) => onSelect(event.target.checked)}
          className="screenshot-hidden"
          sx={{ alignSelf: "flex-start" }}
        />
      )}
      {message.author_role === "user" ? (
        <React.Fragment>
          <Box flexShrink={0} minWidth={48} flexGrow={1} />
          {messageBox}
          <MessageAvatar role={message.author_role} />
        </React.Fragment>
      ) : (
        <React.Fragment>
          <MessageAvatar role={message.author_role} />
          {messageBox}
          <Box flexShrink={0} minWidth={48} flexGrow={1} />
        </React.Fragment>
      )}

      {messageMenu}
    </Stack>
  );
}

function MessageList({
  messages,
  onShare,
}: {
  messages: Message[] | null;
  onShare: () => Promise<void>;
}) {
  const [multiSelecting, setMultiSelecting] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(
    new Set()
  );
  const ref = React.useRef<HTMLDivElement>(null);

  const handleShare = useCallback(async () => {
    await onShare();
    setMultiSelecting(false);
    setSelectedMessages(new Set());
  }, [onShare]);

  const multiSelectToolbar = (
    <Slide in={multiSelecting} direction="up">
      <Box
        className="screenshot-excluded"
        sx={{
          position: "absolute",
          left: 0,
          bottom: 16,
          width: "100%",
          zIndex: 1000,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Card component={Stack} direction="row" spacing={1} sx={{ padding: 1 }}>
          <IconButton
            onClick={() => {
              setSelectedMessages(
                selectedMessages.size === messages.length
                  ? new Set()
                  : new Set(messages.map((message) => message.id))
              );
            }}
          >
            <SelectAll />
          </IconButton>
          <IconButton onClick={handleShare}>
            <ShareIcon />
          </IconButton>
          <IconButton
            onClick={() => {
              setMultiSelecting(false);
              setSelectedMessages(new Set());
            }}
          >
            <CancelOutlinedIcon />
          </IconButton>
        </Card>
      </Box>
    </Slide>
  );

  return (
    <Stack ref={ref} spacing={2}>
      {messages === null ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <CircularProgress />
        </Box>
      ) : (
        messages.map((message) => (
          <MessageListItem
            key={message.id}
            message={message}
            multiSelecting={multiSelecting}
            onMultiSelectingChange={setMultiSelecting}
            selected={selectedMessages.has(message.id)}
            onSelect={(selected) => {
              setSelectedMessages((selectedMessages) => {
                const newSelectedMessages = new Set(selectedMessages);
                if (selected) {
                  newSelectedMessages.add(message.id);
                } else {
                  newSelectedMessages.delete(message.id);
                }
                return newSelectedMessages;
              });
            }}
          />
        ))
      )}
      {multiSelectToolbar}
    </Stack>
  );
}

export default connect((state: AppState) => ({
  messages:
    state.conversations.currentConversationId === null
      ? []
      : Object.values(
          state.conversations.conversations[
            state.conversations.currentConversationId
          ].messages
        ),
}))(MessageList);
