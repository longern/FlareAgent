import React, { Suspense, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  AppBar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Toolbar,
  Typography,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";

import { useActionsState } from "./ActionsProvider";

const JsonEditor = React.lazy(async () => {
  const [{ default: CodeMirror }, { json }] = await Promise.all([
    import("@uiw/react-codemirror"),
    import("@codemirror/lang-json"),
  ]);
  return {
    default: ({
      value,
      onChange,
    }: {
      value: string;
      onChange: (value: string) => void;
    }) => (
      <CodeMirror
        value={value}
        height="24em"
        extensions={[json()]}
        onChange={onChange}
      />
    ),
  };
});

function ToolsDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [toolDefinition, setToolDefinition] = useState("");
  const [actions, setActions] = useActionsState();
  const [editingAction, setEditingAction] = useState<
    (typeof actions)[number] | null | undefined
  >(null);

  function handleSave() {
    const newAction: (typeof actions)[number] = JSON.parse(toolDefinition);
    setActions((actions) =>
      editingAction === undefined
        ? [...actions, newAction]
        : actions.map((action) =>
            action === editingAction ? newAction : action
          )
    );
    setEditingAction(null);
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <AppBar position="relative">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={onClose}
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
          <Typography variant="h6" sx={{ ml: 2, flex: 1 }}>
            {editingAction ? editingAction.info.title : t("Tools")}
          </Typography>
        </Toolbar>
      </AppBar>
      {editingAction === null ? (
        actions === null ? (
          <CircularProgress />
        ) : (
          <List>
            {actions.map((action) => (
              <ListItem key={action.info.title} disablePadding>
                <ListItemButton
                  onClick={() => {
                    setEditingAction(action);
                    setToolDefinition(JSON.stringify(action, null, 2));
                  }}
                >
                  <ListItemText
                    primary={action.info.title}
                    secondary={action.info.description}
                  />
                </ListItemButton>
              </ListItem>
            ))}
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => {
                  setEditingAction(undefined);
                  setToolDefinition("");
                }}
              >
                <ListItemText primary={t("New...")} />
              </ListItemButton>
            </ListItem>
          </List>
        )
      ) : (
        <>
          <Suspense
            fallback={
              <Box
                sx={{
                  display: "flex",
                  height: "24em",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <CircularProgress />
              </Box>
            }
          >
            <JsonEditor value={toolDefinition} onChange={setToolDefinition} />
          </Suspense>
          <DialogActions>
            <Button
              variant="outlined"
              onClick={() => {
                setEditingAction(null);
                setToolDefinition("");
              }}
            >
              {t("Cancel")}
            </Button>
            <Button variant="contained" color="primary" onClick={handleSave}>
              {t("Save")}
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}

export default ToolsDialog;
