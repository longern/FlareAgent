import React from "react";
import { Avatar, Box, Stack } from "@mui/material";
import {
  Build as BuildIcon,
  Person as PersonIcon,
  SmartToy as SmartToyIcon,
} from "@mui/icons-material";
import Markdown from "react-markdown";
import { Prism } from "react-syntax-highlighter";
import { dark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";

function MarkdownHighlighter({ children }: { children: string }) {
  return (
    <Markdown
      components={{
        code(props) {
          const { children, className, node, ...rest } = props;
          const match = /language-(\w+)/.exec(className || "");
          return match ? (
            <Prism
              PreTag="div"
              children={String(children).replace(/\n$/, "")}
              language={match[1]}
              style={dark}
            />
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
              overflowWrap: "break-word",
              padding: "0.5em 0.8em",
              borderRadius: "14px",
              backgroundColor: message.role === "user" ? "#e0e0e0" : "#f5f5f5",
              "& p": { margin: 0 },
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
              <Box sx={{ maxHeight: "12rem", overflow: "auto" }}>
                {message.content}
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
