import { Send as SendIcon } from "@mui/icons-material";
import {
  IconButton,
  Stack,
  TextField,
  Theme,
  useMediaQuery,
} from "@mui/material";
import { ChatCompletionContentPart } from "openai/resources/index.mjs";
import React, { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { setAbortable } from "../../app/abort";
import {
  createConversation,
  createMessage,
  fetchAssistantMessage,
  fetchDrawings,
  fetchSpeech,
} from "../../app/conversations";
import { showError } from "../../app/error";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { setInputImages } from "../../app/inputImages";

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    return reader.readAsDataURL(blob);
  });
}

function extractTitle(userInput: string | ChatCompletionContentPart[]) {
  return (
    typeof userInput === "string"
      ? userInput
      : userInput
          .map((part) => (part.type === "text" ? part.text : ""))
          .join("")
  ).slice(0, 10);
}

async function pasteImages(): Promise<string[]> {
  try {
    const clipboardItems = await navigator.clipboard.read();
    const dataUrls = await Promise.all(
      clipboardItems.map(async (clipboardItem) => {
        const imageTypes = clipboardItem.types?.filter((type) =>
          type.startsWith("image/")
        );
        const dataUrls = await Promise.all(
          imageTypes.map(async (imageType) => {
            const blob = await clipboardItem.getType(imageType);
            return await blobToDataUrl(blob);
          })
        );
        return dataUrls;
      })
    );
    return dataUrls.flat();
  } catch (e) {
    return [];
  }
}

function useHandleSend() {
  const model = useAppSelector((state) => state.models.model);
  const currentConversationId = useAppSelector(
    (state) => state.conversations.currentConversationId
  );
  const dispatch = useAppDispatch();

  return useCallback(
    (userInput: ChatCompletionContentPart[]) => {
      const messageId = crypto.randomUUID();
      const timestamp = Date.now();
      const message = {
        id: messageId,
        author_role: "user" as const,
        content: userInput,
        create_time: timestamp,
      };
      dispatch(
        currentConversationId
          ? createMessage(message)
          : createConversation({
              id: crypto.randomUUID(),
              title: extractTitle(userInput) || "Untitled",
              create_time: timestamp,
              messages: { [messageId]: message },
            })
      );
      const textContent = userInput
        .map((part) => (part.type === "text" ? part.text : ""))
        .join("");
      const promise = dispatch(
        model === "dall-e-3"
          ? fetchDrawings(textContent)
          : model.startsWith("tts-")
          ? fetchSpeech(textContent)
          : fetchAssistantMessage(model)
      );
      dispatch(setAbortable(promise));
      promise
        .unwrap()
        .catch((error) => dispatch(showError({ message: error.message })))
        .finally(() => dispatch(setAbortable(null)));
    },
    [dispatch, currentConversationId, model]
  );
}

function UserInput() {
  const [userInput, setUserInput] = useState<string>("");
  const images = useAppSelector((state) => state.inputImages.images);
  const userInputRef = useRef<HTMLDivElement | null>(null);

  const matchesLg = useMediaQuery((theme: Theme) => theme.breakpoints.up("lg"));
  const { t } = useTranslation();
  const onSend = useHandleSend();
  const dispatch = useAppDispatch();

  const handleSend = useCallback(() => {
    if (userInput === "" && !images.length) return;
    if (images.length) {
      onSend([
        { type: "text", text: userInput },
        ...images.map(
          (image) =>
            ({
              type: "image_url",
              image_url: { url: image },
            } as ChatCompletionContentPart)
        ),
      ]);
      dispatch(setInputImages([]));
    } else {
      onSend([{ type: "text", text: userInput }]);
    }
    setUserInput("");
    userInputRef.current!.blur();
  }, [dispatch, userInput, images, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (matchesLg && e.key === "Enter" && !e.shiftKey && !e.ctrlKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const sendButton = (
    <IconButton
      aria-label="send"
      size="small"
      disabled={userInput === "" && !images.length}
      onClick={handleSend}
      sx={{ alignSelf: "flex-end" }}
    >
      <SendIcon />
    </IconButton>
  );

  return (
    <Stack
      direction="row"
      alignItems="flex-center"
      spacing={1}
      sx={{ flexShrink: 0, marginY: 1 }}
    >
      <TextField
        ref={userInputRef}
        value={userInput}
        multiline
        fullWidth
        size="small"
        onChange={(e) => setUserInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onPaste={async () => {
          const pastedImages = await pasteImages();
          dispatch(setInputImages([...images, ...pastedImages]));
        }}
        inputProps={{ "aria-label": t("User input") }}
        InputProps={{
          sx: { backgroundColor: (theme) => theme.palette.background.paper },
          endAdornment: sendButton,
        }}
      />
    </Stack>
  );
}

export default UserInput;
