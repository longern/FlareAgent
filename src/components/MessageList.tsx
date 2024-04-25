import React, { Suspense, useMemo, useState } from "react";
import {
  Avatar,
  Box,
  CircularProgress,
  Collapse,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import {
  Build as BuildIcon,
  ContentCopy as ContentCopyIcon,
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
import { useAppSelector } from "../app/hooks";

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

function MessageListItem({
  message,
  selected,
  onSelect,
  onUnselect,
}: {
  message: ChatCompletionMessageParam;
  selected: boolean;
  onSelect: () => void;
  onUnselect: () => void;
}) {
  const avatarUrl = useAppSelector((state) => state.identity.avatarUrl);

  const content = useMemo(() => {
    return <MessageListItemContent message={message} />;
  }, [message]);

  return (
    <Stack
      direction={message.role === "user" ? "row-reverse" : "row"}
      spacing={1}
    >
      {message.role === "system" ? (
        <Avatar>S</Avatar>
      ) : message.role === "user" ? (
        <Avatar src={avatarUrl}>
          <PersonIcon />
        </Avatar>
      ) : message.role === "assistant" ? (
        <Avatar sx={{ backgroundColor: "#19c37d" }}>
          <SmartToyIcon />
        </Avatar>
      ) : message.role === "tool" ? (
        <Avatar>
          <BuildIcon />
        </Avatar>
      ) : (
        <Avatar>?</Avatar>
      )}
      <Box
        sx={{
          minWidth: 0,
          overflow: "hidden",
          overflowWrap: "break-word",
        }}
      >
        <Box
          sx={{
            padding: "0.5em 0.8em",
            borderRadius: "14px",
            backgroundColor: (theme) =>
              message.role === "user"
                ? theme.palette.mode === "dark"
                  ? "#333333"
                  : "#e0e0e0"
                : theme.palette.mode === "dark"
                ? "#1f1f1f"
                : "#f5f5f5",
            "& img": { display: "block", maxWidth: "100%" },
            "& p": { margin: 0 },
            "& pre": { margin: 0 },
            "& pre>code": { whiteSpace: "pre-wrap" },
          }}
          onClick={() => (selected ? onUnselect() : onSelect())}
        >
          {content}
        </Box>

        <Collapse in={selected}>
          <Stack
            direction="row"
            sx={{ fontSize: "0.8rem", color: "text.secondary" }}
          >
            <IconButton
              size="small"
              onClick={() => {
                navigator.clipboard.writeText(message.content as string);
              }}
            >
              <ContentCopyIcon />
            </IconButton>
            <IconButton size="small" onClick={onUnselect}>
              <ReplayIcon />
            </IconButton>
          </Stack>
        </Collapse>
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
  const [selected, setSelected] = useState<number | null>(null);

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
          <MessageListItem
            key={index}
            message={message}
            selected={selected === index}
            onSelect={() => setSelected(index)}
            onUnselect={() => setSelected(null)}
          />
        ))
      )}
    </Stack>
  );
}

export default MessageList;
