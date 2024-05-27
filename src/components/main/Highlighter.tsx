import { ContentCopy as ContentCopyIcon } from "@mui/icons-material";
import { Box, IconButton, Link, Stack, Typography } from "@mui/material";
import React from "react";

function HighlighterBlock({
  code,
  language,
  children,
  ...props
}: {
  code: string;
  language: string;
  children: React.ReactNode;
  [key: string]: any;
}) {
  return (
    <Box
      sx={{
        marginTop: 1,
        backgroundColor: "rgb(122, 102, 82)",
        color: "white",
        borderRadius: "0.5em",
      }}
    >
      <Stack
        direction="row"
        sx={{ paddingX: 1, marginBottom: -1.5, alignItems: "center" }}
      >
        <Typography
          variant="caption"
          sx={{ padding: "5px", userSelect: "none" }}
        >
          {language}
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <IconButton
          size="small"
          sx={{ color: "inherit" }}
          onClick={() => navigator.clipboard.writeText(code)}
        >
          <ContentCopyIcon fontSize="small" />
        </IconButton>
      </Stack>
      <div {...props}>{children}</div>
    </Box>
  );
}

export const Highlighter = React.lazy(async () => {
  const [{ Prism }, { dark }] = await Promise.all([
    import("react-syntax-highlighter"),
    import("react-syntax-highlighter/dist/esm/styles/prism"),
  ]);

  return {
    default: ({
      children: code,
      language,
    }: {
      children: string;
      language: string;
    }) => {
      const PreTag = function ({
        children,
        ...props
      }: {
        children: React.ReactNode;
        [key: string]: any;
      }) {
        return (
          <HighlighterBlock code={code} language={language} {...props}>
            {children}
          </HighlighterBlock>
        );
      };

      return (
        <Prism
          PreTag={PreTag}
          children={code}
          language={language}
          style={dark}
        />
      );
    },
  };
});

const preprocessLaTeX = (content: string) => {
  // Replace block-level LaTeX delimiters \[ \] with $$ $$
  const blockProcessedContent = content.replace(
    /\\\[\s(.*?)\s\\\]/gs,
    (_, equation) => `$$\n${equation}\n$$`
  );

  // Replace inline LaTeX delimiters \( \) with $ $
  const inlineProcessedContent = blockProcessedContent.replace(
    /\\\((.*?)\\\)/gs,
    (_, equation) => `$${equation}$`
  );

  return inlineProcessedContent;
};

export const MarkdownHighlighter = React.lazy(async () => {
  const [
    { default: Markdown },
    { default: rehypeKatex },
    { default: remarkMath },
  ] = await Promise.all([
    import("react-markdown"),
    import("rehype-katex"),
    import("remark-math"),
  ]);
  return {
    default: ({ children }: { children: string }) => {
      return (
        <Markdown
          components={{
            a: ({ node, children, ref, ...props }) => {
              let url = new URL(props.href ?? "", window.location.href);
              if (url.origin !== window.location.origin) {
                props.target = "_blank";
                props.rel = "noopener noreferrer";
              }

              return (
                <Link
                  {...props}
                  underline="hover"
                  onContextMenu={(event) => event.stopPropagation()}
                >
                  {children}
                </Link>
              );
            },
            code(props) {
              const { children, className, node, ...rest } = props;
              const match = /language-(\w+)/.exec(className || "");
              return match ? (
                <Highlighter
                  children={String(children).replace(/\n$/, "")}
                  language={match[1]}
                />
              ) : (
                <code {...rest} className={className}>
                  {children}
                </code>
              );
            },
          }}
          remarkPlugins={[remarkMath]}
          rehypePlugins={[rehypeKatex]}
        >
          {preprocessLaTeX(children)}
        </Markdown>
      );
    },
  };
});
