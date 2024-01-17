import { IconButton, TextField, Theme, useMediaQuery } from "@mui/material";
import React, { useRef, useState } from "react";
import { Send as SendIcon } from "@mui/icons-material";

function UserInput({ onSend }: { onSend: (userInput: string) => void }) {
  const [userInput, setUserInput] = useState<string>("");
  const userInputRef = useRef<HTMLDivElement | null>(null);

  const matchesLg = useMediaQuery((theme: Theme) => theme.breakpoints.up("lg"));

  return (
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
      sx={{ flexShrink: 0, marginY: 1 }}
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
  );
}

export default UserInput;
