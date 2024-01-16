import React from "react";
import Markdown from "react-markdown";
import { Prism } from "react-syntax-highlighter";
import { dark } from "react-syntax-highlighter/dist/esm/styles/prism";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";

export function Highlighter({
  children,
  language,
}: {
  children: string;
  language: string;
}) {
  return (
    <Prism PreTag="div" children={children} language={language} style={dark} />
  );
}

export function MarkdownHighlighter({ children }: { children: string }) {
  return (
    <Markdown
      components={{
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
      {children}
    </Markdown>
  );
}
