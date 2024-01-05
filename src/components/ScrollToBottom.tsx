import React from "react";

const observer = new ResizeObserver((entries) => {
  for (const entry of entries) {
    const target = entry.target as HTMLDivElement;
    target.scrollIntoView({ behavior: "smooth", block: "end" });
  }
});

function ScrollToBottom({
  scrollToBottom,
  component,
  behavior,
  onScrollToBottomChange,
  children,
  ...props
}: {
  scrollToBottom: boolean;
  component?: React.ElementType;
  behavior?: "auto" | "smooth";
  onScrollToBottomChange: (scrollToBottom: boolean) => void;
  children: React.ReactNode;
  [key: string]: any;
}) {
  const Component = component || "div";
  const componentRef = React.useRef<HTMLDivElement>(null);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const container = ref.current!;
    if (!scrollToBottom) return;
    observer.observe(container);
    return () => observer.unobserve(container);
  }, [scrollToBottom]);

  React.useEffect(() => {
    const component = componentRef.current!;
    function handler() {
      const { scrollHeight, scrollTop, clientHeight } = componentRef.current!;
      const scrollToBottom = scrollHeight - scrollTop - clientHeight <= 8;
      onScrollToBottomChange(scrollToBottom);
    }
    component.addEventListener("scroll", handler);
    return () => component.removeEventListener("scroll", handler);
  }, [onScrollToBottomChange]);

  React.useEffect(() => {
    if (scrollToBottom) {
      ref.current!.scrollIntoView({
        behavior: behavior || "auto",
        block: "end",
      });
    }
  }, [behavior, scrollToBottom]);

  return (
    <Component ref={componentRef} {...props}>
      <div ref={ref}>{children}</div>
    </Component>
  );
}

export default ScrollToBottom;
