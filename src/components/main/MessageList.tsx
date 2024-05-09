import React, { Suspense, useCallback, useMemo, useState } from "react";
import {
  Avatar,
  Box,
  CircularProgress,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";
import {
  Build as BuildIcon,
  ContentCopy as ContentCopyIcon,
  Menu as MenuIcon,
  Person as PersonIcon,
  Replay as ReplayIcon,
  SmartToy as SmartToyIcon,
} from "@mui/icons-material";
import {
  ChatCompletionMessageParam,
  ChatCompletionMessageToolCall,
} from "openai/resources/index";
import { useTranslation } from "react-i18next";
import "katex/dist/katex.min.css";

import { Highlighter, MarkdownHighlighter } from "./Highlighter";
import { useAppSelector } from "../../app/hooks";
import { connect } from "react-redux";
import { AppState } from "../../app/store";

function MaybeJsonBlock({ children }: { children: string }) {
  try {
    const pretty = JSON.stringify(JSON.parse(children), null, 2);
    return (
      <pre>
        <div style={{ overflow: "auto" }}>
          <code>{pretty}</code>
        </div>
      </pre>
    );
  } catch (e) {
    return (
      <pre>
        <code>{children}</code>
      </pre>
    );
  }
}

function MaybePythonBlock({ children }: { children: string }) {
  try {
    const parsed: { code: string } = JSON.parse(children);
    return (
      <Suspense
        fallback={
          <pre>
            <div style={{ overflow: "auto" }}>
              <code>{parsed.code}</code>
            </div>
          </pre>
        }
      >
        <Highlighter children={parsed.code} language={"python"} />
      </Suspense>
    );
  } catch (e) {
    return (
      <pre>
        <code>{children}</code>
      </pre>
    );
  }
}

function AssistantToolCallMessasge({
  tool_call,
}: {
  tool_call: ChatCompletionMessageToolCall;
}) {
  return (
    <div style={{ overflow: "auto", fontSize: "0.8rem" }}>
      <code>
        <div>{tool_call.function.name}</div>
        {tool_call.function.name === "python" ? (
          <MaybePythonBlock>{tool_call.function.arguments}</MaybePythonBlock>
        ) : (
          tool_call.function.arguments
        )}
      </code>
    </div>
  );
}

function MessageListItemContent({
  message,
}: {
  message: ChatCompletionMessageParam;
}) {
  const { t } = useTranslation();

  return message.role === "assistant" ? (
    <>
      {message.content && (
        <Suspense fallback={message.content}>
          <MarkdownHighlighter>{message.content}</MarkdownHighlighter>
        </Suspense>
      )}
      {Array.isArray(message.tool_calls) && message.tool_calls.length > 0 && (
        <>
          <div>{t("Calling functions:")}</div>
          {message.tool_calls.map((tool_call) => (
            <AssistantToolCallMessasge
              key={tool_call.id}
              tool_call={tool_call}
            />
          ))}
        </>
      )}
    </>
  ) : message.role === "tool" ? (
    <Box
      sx={{
        maxHeight: "12rem",
        overflow: "auto",
        fontSize: "0.8rem",
      }}
    >
      {message.content ? (
        <MaybeJsonBlock>{message.content}</MaybeJsonBlock>
      ) : (
        <Typography variant="body2" color="text.secondary">
          {t("No output")}
        </Typography>
      )}
    </Box>
  ) : (
    <Box sx={{ whiteSpace: "pre-wrap" }}>
      {typeof message.content === "string"
        ? message.content
        : message.content.map((part, index) =>
            part.type === "text" ? (
              <span key={index}>{part.text}</span>
            ) : part.type === "image_url" ? (
              <img key={index} src={part.image_url.url} alt="" />
            ) : null
          )}
    </Box>
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

function MessageListItem({ message }: { message: ChatCompletionMessageParam }) {
  const [contextMenu, setContextMenu] = React.useState<{
    mouseX: number;
    mouseY: number;
  } | null>(null);
  const [disableContextMenu, setDisableContextMenu] = useState(false);

  const { t } = useTranslation();

  const content = useMemo(() => {
    return <MessageListItemContent message={message} />;
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

  return (
    <Stack
      direction={message.role === "user" ? "row-reverse" : "row"}
      spacing={1}
    >
      <MessageAvatar role={message.role} />
      <Box sx={{ minWidth: 0, overflow: "hidden", overflowWrap: "break-word" }}>
        <Box
          sx={{
            padding: "0.5em 0.8em",
            borderRadius: "14px",
            backgroundColor: (theme) =>
              message.role === "user"
                ? theme.palette.primary.main
                : theme.palette.background.paper,
            color: (theme) =>
              message.role === "user"
                ? theme.palette.primary.contrastText
                : theme.palette.text.primary,
            "& img": { display: "block", maxWidth: "100%" },
            "& p": { margin: 0 },
            "& pre": { margin: 0 },
            "& pre>code": { whiteSpace: "pre-wrap" },
          }}
          onContextMenu={handleContextMenu}
        >
          {content}
        </Box>

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
          <MenuItem
            onClick={() => {
              navigator.clipboard.writeText(message.content as string);
              const selection = window.getSelection();
              selection?.removeAllRanges();
              setContextMenu(null);
            }}
          >
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
      </Box>
      <Box flexShrink={0} width={48} />
    </Stack>
  );
}

function MessageList({
  messages,
}: {
  messages: ChatCompletionMessageParam[] | null;
}) {
  return (
    <Stack spacing={2}>
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
        messages.map((message, index) => (
          <MessageListItem key={index} message={message} />
        ))
      )}
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
        ).map(
          (message) =>
            ({
              role: message.author_role,
              content: JSON.parse(message.content),
            } as ChatCompletionMessageParam)
        ),
}))(MessageList);
