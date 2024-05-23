import {
  AddCircleOutline as AddCircleOutlineIcon,
  CameraAlt as CameraAltIcon,
  Extension as ExtensionIcon,
  Folder as FolderIcon,
  Image as ImageIcon,
  Phone as PhoneIcon,
  Send as SendIcon,
  Timeline as TimelineIcon,
} from "@mui/icons-material";
import {
  Badge,
  Card,
  CardActionArea,
  CardContent,
  Collapse,
  IconButton,
  Stack,
  TextField,
  Theme,
  Typography,
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
} from "../../app/conversations";
import {
  showFiles,
  showTools,
  showVoiceCall,
  showWorkflows,
} from "../../app/dialogs";
import { showError } from "../../app/error";
import { useAppDispatch, useAppSelector } from "../../app/hooks";

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
    (userInput: string | ChatCompletionContentPart[]) => {
      const messageId = crypto.randomUUID();
      const timestamp = Date.now();
      const message = {
        id: messageId,
        author_role: "user" as const,
        content: JSON.stringify(userInput),
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
      const promise = dispatch(
        model === "dall-e-3"
          ? fetchDrawings(userInput as string)
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

function CaptionButton({
  children,
  caption,
  onClick,
}: {
  children: React.ReactNode;
  caption: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Stack sx={{ alignItems: "center", gap: "4px" }}>
      <Card elevation={0}>
        <CardActionArea onClick={onClick}>
          <CardContent>{children}</CardContent>
        </CardActionArea>
      </Card>
      <Typography variant="caption">{caption}</Typography>
    </Stack>
  );
}

function FooterButtons() {
  const [images, setImages] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<boolean>(false);
  const dispatch = useAppDispatch();

  const { t } = useTranslation();

  const handleImportImage = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = true;
    input.onchange = async () => {
      if (input.files) {
        const files = Array.from(input.files);
        const images = await Promise.all(
          files.map((file) => blobToDataUrl(file))
        );
        setImages(images);
      }
    };
    input.click();
  }, []);

  const handleTakePhoto = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.capture = "environment";
    input.onchange = async () => {
      if (input.files) {
        const files = Array.from(input.files);
        const images = await Promise.all(
          files.map((file) => blobToDataUrl(file))
        );
        setImages(images);
      }
    };
    input.click();
  }, []);

  return (
    <React.Fragment>
      <Stack
        direction="row"
        justifyContent="space-around"
        sx={{ marginTop: -0.5, marginBottom: 0.5 }}
      >
        <IconButton
          aria-label="phone"
          onClick={() => dispatch(showVoiceCall())}
        >
          <PhoneIcon />
        </IconButton>
        <Badge badgeContent={images.length} color="primary" overlap="circular">
          <IconButton
            aria-label={t("Import image")}
            onClick={handleImportImage}
          >
            <ImageIcon />
          </IconButton>
        </Badge>
        <IconButton aria-label={t("Take photo")} onClick={handleTakePhoto}>
          <CameraAltIcon />
        </IconButton>
        <IconButton aria-label="tools" onClick={() => dispatch(showTools())}>
          <ExtensionIcon />
        </IconButton>
        <IconButton aria-label="expand" onClick={() => setExpanded(!expanded)}>
          <AddCircleOutlineIcon />
        </IconButton>
      </Stack>
      <Collapse in={expanded}>
        <Stack
          sx={{
            padding: 4,
            flexDirection: "row",
            justifyContent: "space-evenly",
          }}
        >
          <CaptionButton
            caption={t("Workflow")}
            onClick={() => dispatch(showWorkflows())}
          >
            <TimelineIcon />
          </CaptionButton>
          <CaptionButton
            caption={t("Files")}
            onClick={() => dispatch(showFiles())}
          >
            <FolderIcon />
          </CaptionButton>
        </Stack>
      </Collapse>
    </React.Fragment>
  );
}

const footerButtons = <FooterButtons />;

function UserInput() {
  const [userInput, setUserInput] = useState<string>("");
  const [images, setImages] = useState<string[]>([]);
  const userInputRef = useRef<HTMLDivElement | null>(null);

  const matchesLg = useMediaQuery((theme: Theme) => theme.breakpoints.up("lg"));
  const { t } = useTranslation();
  const onSend = useHandleSend();

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
      setImages([]);
    } else {
      onSend(userInput);
    }
    setUserInput("");
    userInputRef.current!.blur();
  }, [userInput, images, onSend]);

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
    <React.Fragment>
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
            setImages((images) => [...images, ...pastedImages]);
          }}
          inputProps={{ "aria-label": t("User input") }}
          InputProps={{
            sx: { backgroundColor: (theme) => theme.palette.background.paper },
            endAdornment: sendButton,
          }}
        />
      </Stack>
      {footerButtons}
    </React.Fragment>
  );
}

export default UserInput;
