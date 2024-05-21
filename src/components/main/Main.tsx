import React, { useCallback, useState } from "react";
import { Box, Container } from "@mui/material";
import type { Options as HtmlToImageOptions } from "html-to-image/lib/types";

import { ScrollToBottomButton, StopButton } from "./ActionButtons";
import MessageList from "./MessageList";
import ScrollToBottom from "./ScrollToBottom";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { abort } from "../../app/abort";

async function screenshot(element: HTMLElement, options?: HtmlToImageOptions) {
  const { toBlob } = await import("html-to-image");
  const blob = await toBlob(element, options);
  const clipboardItem = new ClipboardItem({ [blob.type]: blob });
  return navigator.clipboard.write([clipboardItem]);
}

function Main({
  messageContainerRef,
}: {
  messageContainerRef: React.RefObject<HTMLDivElement>;
}) {
  const [scrollToBottom, setScrollToBottom] = useState(true);
  const hasAbortable = useAppSelector((state) => state.abort.hasAbortable);
  const dispatch = useAppDispatch();

  const handleShare = useCallback(async () => {
    messageContainerRef.current.classList.add("screenshot");
    await screenshot(messageContainerRef.current!, {
      style: { margin: "0" },
      filter(element: HTMLElement) {
        return !element.classList?.contains("screenshot-excluded");
      },
    });
    messageContainerRef.current.classList.remove("screenshot");
  }, [messageContainerRef]);

  return (
    <Box
      component="main"
      sx={{ position: "relative", minHeight: 0, flexGrow: 1 }}
    >
      <ScrollToBottom
        scrollToBottom={scrollToBottom}
        component={Box}
        sx={{ height: "100%", overflow: "auto" }}
        onScrollToBottomChange={setScrollToBottom}
      >
        <Container
          ref={messageContainerRef}
          maxWidth="md"
          sx={{
            padding: 1,
            backgroundColor: (theme) => theme.palette.background.default,
            height: "auto",
            "&.screenshot .screenshot-hidden": { display: "none" },
          }}
        >
          <MessageList onShare={handleShare} />
        </Container>
      </ScrollToBottom>
      {!scrollToBottom && (
        <ScrollToBottomButton onClick={() => setScrollToBottom(true)} />
      )}
      {hasAbortable && <StopButton onClick={() => dispatch(abort())} />}
    </Box>
  );
}

export default Main;
