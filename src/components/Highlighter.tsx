import React from "react";

export const Highlighter = React.lazy(async () => {
  const [{ Prism }, { dark }] = await Promise.all([
    import("react-syntax-highlighter"),
    import("react-syntax-highlighter/dist/esm/styles/prism"),
  ]);
  return {
    default: ({
      children,
      language,
    }: {
      children: string;
      language: string;
    }) => {
      return (
        <Prism
          PreTag="div"
          children={children}
          language={language}
          style={dark}
        />
      );
    },
  };
});

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
            a: ({ node, children, ...props }) => {
              let url = new URL(props.href ?? "", window.location.href);
              if (url.origin !== window.location.origin) {
                props.target = "_blank";
                props.rel = "noopener noreferrer";
              }

              return <a {...props}>{children}</a>;
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
          {children}
        </Markdown>
      );
    },
  };
});
