import React, { useState } from "react";
import { Box, Container } from "@mui/material";

import { ScrollToBottomButton, StopButton } from "./ActionButtons";
import MessageList from "./MessageList";
import ScrollToBottom from "./ScrollToBottom";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { abort } from "../../app/abort";

function Main({
  messageContainerRef,
}: {
  messageContainerRef: React.RefObject<HTMLDivElement>;
}) {
  const [scrollToBottom, setScrollToBottom] = useState(true);
  const hasAbortable = useAppSelector((state) => state.abort.hasAbortable);
  const dispatch = useAppDispatch();

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
        <Container ref={messageContainerRef} maxWidth="md" sx={{ padding: 1 }}>
          <MessageList />
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
