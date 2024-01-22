import React, { Suspense, lazy } from "react";
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

const MarkdownModule = import("./Highlighter");
const Highlighter = lazy(() =>
  MarkdownModule.then((m) => ({ default: m.Highlighter }))
);
const MarkdownHighlighter = lazy(() =>
  MarkdownModule.then((m) => ({ default: m.MarkdownHighlighter }))
);

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

function MessageList({
  messages,
}: {
  messages: ChatCompletionMessageParam[] | null;
}) {
  const [selected, setSelected] = React.useState<number | null>(null);

  const { t } = useTranslation();

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
                  "& pre": { margin: 0 },
                  "& pre>code": { whiteSpace: "pre-wrap" },
                }}
                onClick={() => setSelected(selected === index ? null : index)}
              >
                {message.role === "assistant" ? (
                  <>
                    {message.content && (
                      <Suspense fallback={message.content}>
                        <MarkdownHighlighter>
                          {message.content}
                        </MarkdownHighlighter>
                      </Suspense>
                    )}
                    {Array.isArray(message.tool_calls) &&
                      message.tool_calls.length > 0 && (
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
        ))
      )}
    </Stack>
  );
}

export default MessageList;
