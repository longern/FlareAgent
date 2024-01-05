import React, { Suspense, lazy } from "react";
import { Avatar, Box, Collapse, IconButton, Stack } from "@mui/material";
import {
  Build as BuildIcon,
  ContentCopy as ContentCopyIcon,
  Person as PersonIcon,
  Replay as ReplayIcon,
  SmartToy as SmartToyIcon,
} from "@mui/icons-material";
import Markdown from "react-markdown";
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { useTranslation } from "react-i18next";

const Highlighter = lazy(() => import("./Highlighter"));

function MarkdownHighlighter({ children }: { children: string }) {
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

function MaybePythonBlock({ children }: { children: string }) {
  try {
    const parsed: { code: string } = JSON.parse(children);
    return (
      <Suspense
        fallback={
          <div style={{ overflow: "auto" }}>
            <code>{parsed.code}</code>
          </div>
        }
      >
        <Highlighter children={parsed.code} language={"python"} />
      </Suspense>
    );
  } catch (e) {
    return children;
  }
}

function MessageList({ messages }: { messages: ChatCompletionMessageParam[] }) {
  const [selected, setSelected] = React.useState<number | null>(null);

  const { t } = useTranslation();

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
            sx={{
              minWidth: 0,
              overflow: "hidden",
              overflowWrap: "break-word",
            }}
          >
            <Box
              key={index}
              sx={{
                padding: "0.5em 0.8em",
                borderRadius: "14px",
                backgroundColor:
                  message.role === "user" ? "#e0e0e0" : "#f5f5f5",
                "& img": { maxWidth: "100%" },
                "& p": { margin: 0 },
                "& pre>code": { whiteSpace: "pre-wrap" },
              }}
              onClick={() => setSelected(selected === index ? null : index)}
            >
              {message.role === "assistant" ? (
                message.tool_calls?.length > 0 ? (
                  <>
                    <span>{t("Calling functions:")}</span>
                    {message.tool_calls.map((tool_call) => (
                      <div
                        key={tool_call.id}
                        style={{ overflow: "auto", fontSize: "0.8rem" }}
                      >
                        <code>
                          {tool_call.function.name}
                          <br />
                          {tool_call.function.name === "python" ? (
                            <MaybePythonBlock>
                              {tool_call.function.arguments}
                            </MaybePythonBlock>
                          ) : (
                            tool_call.function.arguments
                          )}
                        </code>
                      </div>
                    ))}
                  </>
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
                <Box sx={{ whiteSpace: "pre-wrap" }}>
                  {message.content as string}
                </Box>
              )}
            </Box>

            <Collapse in={selected === index}>
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
                <IconButton
                  size="small"
                  onClick={() => {
                    setSelected(null);
                  }}
                >
                  <ReplayIcon />
                </IconButton>
              </Stack>
            </Collapse>
          </Box>
          <Box flexShrink={0} width={48} />
        </Stack>
      ))}
    </Stack>
  );
}

export default MessageList;
