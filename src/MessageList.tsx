import React, { Suspense, lazy } from "react";
import { Avatar, Box, Stack } from "@mui/material";
import {
  Build as BuildIcon,
  Person as PersonIcon,
  SmartToy as SmartToyIcon,
} from "@mui/icons-material";
import Markdown from "react-markdown";
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";

function MarkdownHighlighter({ children }: { children: string }) {
  const Highlighter = lazy(() => import("./Highlighter"));

  return (
    <Markdown
      components={{
        code(props) {
          const { children, className, node, ...rest } = props;
          const match = /language-(\w+)/.exec(className || "");
          return match ? (
            <Suspense
              fallback={
                <div style={{ overflow: "auto" }}>
                  <code {...rest} className={className}>
                    {children}
                  </code>
                </div>
              }
            >
              <Highlighter
                children={String(children).replace(/\n$/, "")}
                language={match[1]}
              />
            </Suspense>
          ) : (
            <code {...rest} className={className}>
              {children}
            </code>
          );
        },
      }}
    >
      {children}
    </Markdown>
  );
}

function MaybeJsonBlock({ children }: { children: string }) {
  try {
    const pretty = JSON.stringify(JSON.parse(children), null, 2);
    return (
      <pre style={{ margin: 0 }}>
        <div style={{ overflow: "auto" }}>
          <code>{pretty}</code>
        </div>
      </pre>
    );
  } catch (e) {
    return children;
  }
}

function MessageList({ messages }: { messages: ChatCompletionMessageParam[] }) {
  return (
    <Stack spacing={2}>
      {messages.map((message, index) => (
        <Stack
          key={index}
          direction={message.role === "user" ? "row-reverse" : "row"}
          spacing={1}
        >
          {message.role === "system" ? (
            <Avatar>S</Avatar>
          ) : message.role === "user" ? (
            <Avatar>
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
            key={index}
            sx={{
              minWidth: 0,
              overflow: "hidden",
              overflowWrap: "break-word",
              padding: "0.5em 0.8em",
              borderRadius: "14px",
              backgroundColor: message.role === "user" ? "#e0e0e0" : "#f5f5f5",
              "& p": { margin: 0 },
              "& pre>code": { whiteSpace: "pre-wrap" },
            }}
          >
            {message.role === "assistant" ? (
              message.tool_calls?.length > 0 ? (
                "Calling function: " +
                message.tool_calls.map((tool_call) => tool_call.function.name)
              ) : (
                <MarkdownHighlighter>{message.content}</MarkdownHighlighter>
              )
            ) : message.role === "tool" ? (
              <Box
                sx={{
                  maxHeight: "12rem",
                  overflow: "auto",
                  fontSize: "0.8rem",
                }}
              >
                <MaybeJsonBlock>{message.content}</MaybeJsonBlock>
              </Box>
            ) : (
              (message.content as string)
            )}
          </Box>
          <Box flexShrink={0} width={48} />
        </Stack>
      ))}
    </Stack>
  );
}

export default MessageList;
