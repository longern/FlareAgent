import {
  Box,
  Button,
  Card,
  CircularProgress,
  DialogActions,
  DialogContent,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Switch,
} from "@mui/material";
import React, { Suspense, useState } from "react";
import { useTranslation } from "react-i18next";
import { connect } from "react-redux";

import { hideTools } from "../../app/dialogs";
import { AppState } from "../../app/store";
import { useActionsState } from "../ActionsProvider";
import { HistoryDialog } from "./HistoryDialog";

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
    <HistoryDialog
      hash="tools"
      title={t("Tools")}
      open={open}
      onClose={onClose}
    >
      <DialogContent sx={{ padding: 2 }}>
        {editingAction === null ? (
          actions === null ? (
            <CircularProgress />
          ) : (
            <Card>
              <List disablePadding>
                {actions.map((action) => (
                  <ListItem
                    key={action.info.title}
                    disablePadding
                    sx={{ paddingRight: 2 }}
                  >
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
                    <Switch edge="end" checked={false} />
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
            </Card>
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
      </DialogContent>
    </HistoryDialog>
  );
}

export default connect(
  (state: AppState) => ({
    open: state.dialogs.tools,
  }),
  (dispatch) => ({
    onClose: () => dispatch(hideTools()),
  })
)(ToolsDialog);
