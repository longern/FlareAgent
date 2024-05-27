import {
  Card,
  Container,
  ListItem,
  ListItemButton,
  ListItemText,
  Radio,
} from "@mui/material";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { connect } from "react-redux";

import { hideWorkflows, showWorkflow } from "../../app/dialogs";
import { useAppDispatch } from "../../app/hooks";
import { AppState } from "../../app/store";
import { Workflow, defaultWorkflow } from "../../workflow";
import { useWorkflowsState } from "../ActionsProvider";
import { HistoryDialog } from "./HistoryDialog";
import { SparseList } from "./SparseList";

function WorkflowList({
  currentWorkflow,
  onWorkflowChange,
}: {
  currentWorkflow: Workflow | null;
  onWorkflowChange: (workflow: Workflow) => void;
}) {
  const { workflows, newWorkflow } = useWorkflowsState();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const workflowsWithDefault =
    workflows === null ? null : [defaultWorkflow, ...workflows];

  useEffect(() => {
    if (
      workflows !== null &&
      currentWorkflow !== null &&
      currentWorkflow !== defaultWorkflow &&
      !workflows.includes(currentWorkflow)
    ) {
      onWorkflowChange(defaultWorkflow);
    }
  }, [workflows, currentWorkflow, onWorkflowChange]);

  return (
    <SparseList disablePadding>
      {workflowsWithDefault === null ? (
        <ListItem>
          <ListItemText primary={t("Loading...")} />
        </ListItem>
      ) : (
        workflowsWithDefault.map((workflow) => (
          <ListItem
            disablePadding
            key={workflow.name}
            secondaryAction={
              <Radio
                checked={currentWorkflow?.name === workflow.name}
                onChange={() => onWorkflowChange(workflow)}
                value={workflow.name}
                name="workflow"
                inputProps={{ "aria-label": workflow.name }}
              />
            }
          >
            <ListItemButton
              onClick={() => {
                if (workflow === defaultWorkflow) return;
                dispatch(showWorkflow(workflow));
              }}
            >
              <ListItemText>{workflow.name}</ListItemText>
            </ListItemButton>
          </ListItem>
        ))
      )}
      <ListItem disablePadding>
        <ListItemButton onClick={newWorkflow}>
          <ListItemText>{t("New...")}</ListItemText>
        </ListItemButton>
      </ListItem>
    </SparseList>
  );
}

function WorkflowsDialog({
  open,
  onClose,
  currentWorkflow,
  onWorkflowChange,
}: {
  open: boolean;
  onClose: () => void;
  currentWorkflow: Workflow | null;
  onWorkflowChange: (workflow: Workflow) => void;
}) {
  const { t } = useTranslation();

  return (
    <HistoryDialog
      hash="workflows"
      title={t("Workflows")}
      open={open}
      onClose={onClose}
    >
      <Container maxWidth="md" sx={{ padding: 2 }}>
        <Card elevation={0}>
          <WorkflowList
            currentWorkflow={currentWorkflow}
            onWorkflowChange={onWorkflowChange}
          />
        </Card>
      </Container>
    </HistoryDialog>
  );
}

export default connect(
  (state: AppState) => ({
    open: state.dialogs.workflows,
  }),
  (dispatch) => ({
    onClose: () => dispatch(hideWorkflows()),
  })
)(WorkflowsDialog);
