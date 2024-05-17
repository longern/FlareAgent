import {
  Box,
  Button,
  Collapse,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import "katex/dist/katex.min.css";
import { ChatCompletionMessageToolCall } from "openai/resources/index";
import React, { Suspense, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { ChatCompletionExecutionOutput } from "../../app/conversations/thunks";
import { Highlighter } from "./Highlighter";
import { Search } from "@mui/icons-material";

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

export function AssistantToolCallMessasge({
  tool_call,
}: {
  tool_call: ChatCompletionMessageToolCall;
}) {
  const callArguments = useMemo(() => {
    try {
      return JSON.parse(tool_call.function.arguments);
    } catch (e) {
      return tool_call.function.arguments;
    }
  }, [tool_call.function.arguments]);

  return (
    <div style={{ overflow: "auto", fontSize: "0.8rem" }}>
      {tool_call.function.name === "search" ? (
        <Stack direction="row" sx={{ alignItems: "center" }}>
          <Search />
          {callArguments?.keyword}
        </Stack>
      ) : (
        <code>
          <div>{tool_call.function.name}</div>
          {tool_call.function.name === "python" ? (
            <MaybePythonBlock>{tool_call.function.arguments}</MaybePythonBlock>
          ) : (
            tool_call.function.arguments
          )}
        </code>
      )}
    </div>
  );
}

function SearchOutputMessage({ content }: { content: string }) {
  const [expanded, setExpanded] = React.useState(false);

  const body = useMemo(() => {
    try {
      return JSON.parse(content) as {
        results: Array<{ title: string; url: string; abstract: string }>;
      };
    } catch (e) {
      return { results: [] };
    }
  }, [content]);

  return (
    <React.Fragment>
      <Button onClick={() => setExpanded(!expanded)}>
        {body.results.length} results
      </Button>
      <Collapse in={expanded}>
        <List>
          {body.results.map((result, index) => (
            <ListItem key={index} disablePadding>
              <ListItemButton href={result.url} target="_blank">
                <ListItemText
                  primary={result.title}
                  secondary={result.abstract}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Collapse>
    </React.Fragment>
  );
}

export function ToolExecutionOutputMessage({
  content,
}: {
  content: ChatCompletionExecutionOutput;
}) {
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        maxHeight: "12rem",
        overflow: "auto",
        fontSize: "0.8rem",
      }}
    >
      {content.name === "search" ? (
        <SearchOutputMessage content={content.output} />
      ) : content.output ? (
        <MaybeJsonBlock>{content.output}</MaybeJsonBlock>
      ) : (
        <Typography variant="body2" color="text.secondary">
          {t("No output")}
        </Typography>
      )}
    </Box>
  );
}
