import {
  Dialog,
  DialogContent,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
  TextField,
  Theme,
  useMediaQuery,
} from "@mui/material";
import React from "react";

function useApiKey() {
  const [apiKey, setApiKey] = React.useState<string | null>(null);

  React.useEffect(() => {
    const apiKey = localStorage.getItem("openaiApiKey");
    if (apiKey) {
      setApiKey(apiKey);
    }
  }, []);

  React.useEffect(() => {
    if (apiKey) {
      localStorage.setItem("openaiApiKey", apiKey);
    } else {
      localStorage.removeItem("openaiApiKey");
    }
  }, [apiKey]);

  return [apiKey, setApiKey] as const;
}

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [showSettings, setShowSettings] = React.useState<boolean>(false);
  const [apiKey, setApiKey] = useApiKey();

  const matchesLg = useMediaQuery((theme: Theme) => theme.breakpoints.up("lg"));

  return (
    <Drawer
      variant={matchesLg ? "permanent" : "temporary"}
      open={open}
      anchor="left"
      sx={{
        width: "300px",
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: "300px",
          boxSizing: "border-box",
        },
      }}
      onClose={onClose}
    >
      <Stack height="100%">
        <List sx={{ flexGrow: 1, minHeight: 0 }}></List>
        <List>
          <ListItem disablePadding>
            <ListItemButton onClick={() => setShowSettings(true)}>
              <ListItemText>Settings</ListItemText>
            </ListItemButton>
          </ListItem>
        </List>
      </Stack>
      <Dialog open={showSettings} onClose={() => setShowSettings(false)}>
        <DialogContent>
          <TextField
            label="API Key"
            fullWidth
            variant="standard"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
        </DialogContent>
      </Dialog>
    </Drawer>
  );
}

export default Sidebar;
