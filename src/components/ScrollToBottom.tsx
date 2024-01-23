import React from "react";

const parentObserver = new ResizeObserver((entries) => {
  for (const entry of entries) {
    const target = entry.target as HTMLDivElement;
    target.firstElementChild!.scrollIntoView({
      behavior: "instant",
      block: "end",
    });
  }
});

const childObserver = new ResizeObserver((entries) => {
  for (const entry of entries) {
    const target = entry.target as HTMLDivElement;
    target.scrollIntoView({ behavior: "instant", block: "end" });
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
    const parent = componentRef.current!;
    const container = ref.current!;

    if (!scrollToBottom) {
      const observer = new ResizeObserver(() => {
        const { scrollHeight, scrollTop, clientHeight } = parent;
        if (scrollHeight - scrollTop - clientHeight <= 1) {
          onScrollToBottomChange(true);
        }
      });
      observer.observe(parent);
      observer.observe(container);
      return () => observer.disconnect();
    }

    parentObserver.observe(parent);
    childObserver.observe(container);
    return () => {
      parentObserver.unobserve(parent);
      childObserver.unobserve(container);
    };
  }, [scrollToBottom, onScrollToBottomChange]);

  React.useEffect(() => {
    const component = componentRef.current!;
    function handler() {
      // Make sure the scroll event is handled after the DOM is updated.
      setTimeout(() => {
        const { scrollHeight, scrollTop, clientHeight } = componentRef.current!;
        const scrollToBottom = scrollHeight - scrollTop - clientHeight <= 1;
        onScrollToBottomChange(scrollToBottom);
      }, 0);
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
