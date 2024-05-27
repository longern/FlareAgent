import { Add as AddIcon, Save as SaveIcon } from "@mui/icons-material";
import {
  Box,
  Card,
  CircularProgress,
  DialogContent,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Switch,
} from "@mui/material";
import { OpenAPIV3 } from "openapi-types";
import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { connect } from "react-redux";
import YAML from "yaml";

import { hideTools } from "../../app/dialogs";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { AppState } from "../../app/store";
import { createTool, toggleTool, updateTool } from "../../app/tools";
import { HistoryDialog } from "./HistoryDialog";

const YamlEditor = React.lazy(async () => {
  const [{ default: CodeMirror }, { yaml }] = await Promise.all([
    import("@uiw/react-codemirror"),
    import("@codemirror/lang-yaml"),
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
        height="80vh"
        extensions={[yaml()]}
        onChange={onChange}
      />
    ),
  };
});

function EditToolDialog({
  initialToolId,
  open,
  onClose,
}: {
  initialToolId: string | undefined;
  open: boolean;
  onClose: () => void;
}) {
  const tools = useAppSelector((state) => state.tools.tools);
  const [toolDefinition, setToolDefinition] = useState("");
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  useEffect(() => {
    if (!open) return;
    setToolDefinition(
      initialToolId === undefined ? "" : tools[initialToolId].definition
    );
  }, [open, initialToolId, tools]);

  const handleCreate = useCallback(() => {
    dispatch(
      initialToolId === undefined
        ? createTool({
            id: crypto.randomUUID(),
            definition: toolDefinition,
          })
        : updateTool({
            id: initialToolId,
            definition: toolDefinition,
          })
    );
    onClose();
  }, [dispatch, initialToolId, toolDefinition, onClose]);

  return (
    <HistoryDialog
      hash="edit-tool"
      title={t("Edit Tool")}
      open={open}
      onClose={onClose}
      endAdornment={
        <IconButton
          color="inherit"
          aria-label={t("Save")}
          onClick={handleCreate}
        >
          <SaveIcon />
        </IconButton>
      }
    >
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
        <YamlEditor value={toolDefinition} onChange={setToolDefinition} />
      </Suspense>
    </HistoryDialog>
  );
}

function ToolsDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const tools = useAppSelector((state) => state.tools.tools);
  const [initialToolId, setInitialToolId] = useState<string | undefined>(
    undefined
  );
  const [showEditTool, setShowEditTool] = useState(false);
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const parsedTools = useMemo(() => {
    if (tools === null) return null;
    return Object.values(tools).map(({ id, enabled, definition }) => ({
      id,
      enabled,
      definition: YAML.parse(definition) as OpenAPIV3.Document,
    }));
  }, [tools]);

  return (
    <HistoryDialog
      hash="tools"
      title={t("Tools")}
      open={open}
      onClose={onClose}
      endAdornment={
        <IconButton
          color="inherit"
          onClick={() => {
            setInitialToolId(undefined);
            setShowEditTool(true);
          }}
          aria-label={t("Add")}
        >
          <AddIcon />
        </IconButton>
      }
    >
      <DialogContent sx={{ padding: 2 }}>
        {tools === null ? (
          <CircularProgress />
        ) : (
          <Card elevation={0}>
            <List disablePadding>
              {parsedTools.map(({ id, enabled, definition: action }) => (
                <ListItem key={id} disablePadding sx={{ paddingRight: 2 }}>
                  <ListItemButton
                    onClick={() => {
                      setInitialToolId(id);
                      setShowEditTool(true);
                    }}
                  >
                    <ListItemText
                      primary={action.info.title}
                      secondary={action.info.description}
                    />
                  </ListItemButton>
                  <Switch
                    edge="end"
                    checked={enabled ?? false}
                    onChange={() => {
                      dispatch(toggleTool({ id, enabled: !enabled }));
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </Card>
        )}
      </DialogContent>
      <EditToolDialog
        initialToolId={initialToolId}
        open={showEditTool}
        onClose={() => setShowEditTool(false)}
      />
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
