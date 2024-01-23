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
  Image as ImageIcon,
  Screenshot as ScreenshotIcon,
  Send as SendIcon,
} from "@mui/icons-material";
import { importFile } from "../python";

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
          files.map(
            (file) =>
              new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = () => reject(reader.error);
                reader.readAsDataURL(file);
              })
          )
        );
        setImages(images);
      }
    };
    input.click();
  }, []);

  const handleImportFile = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async () => {
      if (input.files) {
        const file = input.files[0];
        importFile(file);
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
      <Collapse in={expanded} sx={{ marginTop: -0.5, marginBottom: 0.5 }}>
        <Stack direction="row" justifyContent="space-around">
          <Badge
            badgeContent={images.length}
            color="primary"
            overlap="circular"
          >
            <IconButton
              aria-label="image"
              size="small"
              onClick={handleImportImage}
            >
              <ImageIcon />
            </IconButton>
          </Badge>
          <IconButton aria-label="file" size="small" onClick={handleImportFile}>
            <AttachFileIcon />
          </IconButton>
          <IconButton
            aria-label="screenshot"
            size="small"
            onClick={onScreenshot}
          >
            <ScreenshotIcon />
          </IconButton>
        </Stack>
      </Collapse>
    </>
  );
}

export default UserInput;
