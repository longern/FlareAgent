import {
  Box,
  Button,
  Collapse,
  IconButton,
  Link,
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

import { ChatCompletionExecutionOutput } from "../../app/conversations/textGeneration";
import { Highlighter } from "./Highlighter";
import {
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  Search as SearchIcon,
  Web as WebIcon,
} from "@mui/icons-material";

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

function PythonToolCallMessage({ content }: { content: any }) {
  const [expanded, setExpanded] = React.useState(false);

  const { t } = useTranslation();

  const code: string = content?.code ?? content;

  return (
    <React.Fragment>
      <Button onClick={() => setExpanded(!expanded)}>
        {t("Python code")}
        {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
      </Button>
      <Collapse in={expanded} mountOnEnter unmountOnExit>
        <Suspense
          fallback={
            <pre>
              <div style={{ overflow: "auto" }}>
                <code>{code}</code>
              </div>
            </pre>
          }
        >
          <Highlighter children={code} language={"python"} />
        </Suspense>
      </Collapse>
    </React.Fragment>
  );
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
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <SearchIcon />
          <p>{callArguments?.keyword}</p>
        </Stack>
      ) : tool_call.function.name === "browser" ? (
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <WebIcon />
          <Link href={callArguments?.url} target="_blank">
            {callArguments?.url}
          </Link>
        </Stack>
      ) : tool_call.function.name === "python" ? (
        <PythonToolCallMessage content={callArguments} />
      ) : (
        <code>
          <div>{tool_call.function.name}</div>
          {tool_call.function.arguments}
        </code>
      )}
    </div>
  );
}

function SearchOutputMessage({ content }: { content: string }) {
  const [expanded, setExpanded] = React.useState(false);

  const { t } = useTranslation();

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
        {t("searchResultsWithCount", { count: body.results.length })}
        {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
      </Button>
      <Collapse in={expanded} mountOnEnter unmountOnExit>
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
  const [isOverflowing, setIsOverflowing] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);
  const { t } = useTranslation();
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!ref.current) return;
    const isOverflowing = ref.current.scrollHeight > ref.current.clientHeight;
    setIsOverflowing(isOverflowing);
    setExpanded(!isOverflowing);
  }, [content]);

  return (
    <Box
      ref={ref}
      sx={{
        position: "relative",
        maxHeight: expanded ? undefined : "12rem",
        overflow: "hidden",
        fontSize: "0.8rem",
      }}
    >
      {content.name === "search" ? (
        <SearchOutputMessage content={content.output} />
      ) : content.output ? (
        content.output.startsWith("data:image/png;base64,") ? (
          <img
            src={content.output}
            alt={content.name}
            onContextMenu={(event) => event.stopPropagation()}
          />
        ) : (
          <MaybeJsonBlock>{content.output}</MaybeJsonBlock>
        )
      ) : (
        <Typography variant="body2" color="text.secondary">
          {t("No output")}
        </Typography>
      )}
      {isOverflowing && !expanded && (
        <IconButton
          aria-label={t("Expand")}
          size="small"
          sx={{ position: "absolute", right: 0, bottom: 0 }}
          onClick={() => setExpanded(true)}
        >
          <ExpandMoreIcon />
        </IconButton>
      )}
    </Box>
  );
}
