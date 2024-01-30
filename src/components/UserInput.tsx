import {
  Badge,
  Collapse,
  IconButton,
  Stack,
  TextField,
  Theme,
  useMediaQuery,
} from "@mui/material";
import React, { useCallback, useRef, useState } from "react";
import { ChatCompletionContentPart } from "openai/resources/index.mjs";

import {
  Add as AddIcon,
  AttachFile as AttachFileIcon,
  Extension as ExtensionIcon,
  Image as ImageIcon,
  Screenshot as ScreenshotIcon,
  Send as SendIcon,
  Timeline as TimelineIcon,
} from "@mui/icons-material";
import { importFile } from "../python";
import { useGlobalComponents } from "./global/GlobalComponents";

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
  const { ToolsDialog } = useGlobalComponents();

  const matchesLg = useMediaQuery((theme: Theme) => theme.breakpoints.up("lg"));

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

  const handleImportFile = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "*/*";
    input.multiple = true;
    input.onchange = async () => {
      if (input.files) {
        const files = Array.from(input.files);
        files.forEach((file) => importFile(file));
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
          onKeyDown={(e) => {
            if (matchesLg && e.key === "Enter" && !e.shiftKey && !e.ctrlKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          onPaste={async () => {
            const pastedImages = await pasteImages();
            setImages((images) => [...images, ...pastedImages]);
          }}
          inputProps={{ "aria-label": "user input" }}
          InputProps={{
            sx: { borderRadius: "16px" },
            endAdornment: (
              <IconButton
                aria-label="send"
                size="small"
                disabled={userInput === ""}
                onClick={handleSend}
                sx={{ alignSelf: "flex-end" }}
              >
                <SendIcon />
              </IconButton>
            ),
          }}
        />
        <Stack sx={{ justifyContent: "center" }}>
          <IconButton aria-label="more" onClick={() => setExpanded(!expanded)}>
            <AddIcon />
          </IconButton>
        </Stack>
      </Stack>
      <Collapse in={expanded}>
        <Stack
          direction="row"
          justifyContent="space-around"
          sx={{ marginTop: -0.5, marginBottom: 0.5 }}
        >
          <Badge
            badgeContent={images.length}
            color="primary"
            overlap="circular"
          >
            <IconButton aria-label="image" onClick={handleImportImage}>
              <ImageIcon />
            </IconButton>
          </Badge>
          <IconButton aria-label="file" onClick={handleImportFile}>
            <AttachFileIcon />
          </IconButton>
          <IconButton aria-label="screenshot" onClick={onScreenshot}>
            <ScreenshotIcon />
          </IconButton>
          <IconButton aria-label="workflows">
            <TimelineIcon />
          </IconButton>
          <IconButton aria-label="tools" onClick={ToolsDialog.open}>
            <ExtensionIcon />
          </IconButton>
        </Stack>
      </Collapse>
    </>
  );
}

export default UserInput;
