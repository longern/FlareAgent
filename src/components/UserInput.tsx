import {
  Collapse,
  IconButton,
  Stack,
  TextField,
  Theme,
  useMediaQuery,
} from "@mui/material";
import React, { useCallback, useRef, useState } from "react";
import {
  Add as AddIcon,
  AttachFile as AttachFileIcon,
  Image as ImageIcon,
  Send as SendIcon,
} from "@mui/icons-material";
import { importFile } from "../python";

function UserInput({ onSend }: { onSend: (userInput: string) => void }) {
  const [userInput, setUserInput] = useState<string>("");
  const [expanded, setExpanded] = useState<boolean>(false);
  const userInputRef = useRef<HTMLDivElement | null>(null);

  const matchesLg = useMediaQuery((theme: Theme) => theme.breakpoints.up("lg"));

  const handleImportImage = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {};
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
              if (userInput === "") return;
              onSend(userInput);
              setUserInput("");
              userInputRef.current!.blur();
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
                onClick={() => {
                  onSend(userInput);
                  setUserInput("");
                  userInputRef.current!.blur();
                }}
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
        <Stack direction="row" spacing={1}>
          <IconButton
            aria-label="image"
            size="small"
            onClick={handleImportImage}
          >
            <ImageIcon />
          </IconButton>
          <IconButton aria-label="file" size="small" onClick={handleImportFile}>
            <AttachFileIcon />
          </IconButton>
        </Stack>
      </Collapse>
    </>
  );
}

export default UserInput;
