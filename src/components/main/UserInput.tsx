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
import React, { useCallback, useRef, useState } from "react";
import { ChatCompletionContentPart } from "openai/resources/index.mjs";
import {
  AddCircleOutline as AddCircleOutlineIcon,
  Extension as ExtensionIcon,
  Folder as FolderIcon,
  Image as ImageIcon,
  Phone as PhoneIcon,
  Screenshot as ScreenshotIcon,
  Send as SendIcon,
  Timeline as TimelineIcon,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";

import { useAppDispatch } from "../../app/hooks";
import { showFiles, showTools } from "../../app/dialogs";

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    return reader.readAsDataURL(blob);
  });
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

function UserInput({
  onSend,
  onScreenshot,
}: {
  onSend: (userInput: string | ChatCompletionContentPart[]) => void;
  onScreenshot: () => void;
}) {
  const [userInput, setUserInput] = useState<string>("");
  const [images, setImages] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<boolean>(false);
  const userInputRef = useRef<HTMLDivElement | null>(null);
  const dispatch = useAppDispatch();

  const matchesLg = useMediaQuery((theme: Theme) => theme.breakpoints.up("lg"));
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

  const handleCapturePhoto = useCallback((event: React.MouseEvent) => {
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
    <>
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
      <Stack
        direction="row"
        justifyContent="space-around"
        sx={{ marginTop: -0.5, marginBottom: 0.5 }}
      >
        <IconButton aria-label="phone">
          <PhoneIcon />
        </IconButton>
        <Badge badgeContent={images.length} color="primary" overlap="circular">
          <IconButton
            aria-label="image"
            onClick={handleImportImage}
            onContextMenu={handleCapturePhoto}
          >
            <ImageIcon />
          </IconButton>
        </Badge>
        <IconButton aria-label="screenshot" onClick={onScreenshot}>
          <ScreenshotIcon />
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
          <CaptionButton caption={t("Workflow")}>
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
    </>
  );
}

export default UserInput;
