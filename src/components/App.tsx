import { Container, Divider, Stack, Theme, useMediaQuery } from "@mui/material";
import React, { useCallback, useRef, useState } from "react";

import { abort } from "../app/abort";
import { setCurrentConversation } from "../app/conversations";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { Workflow, defaultWorkflow } from "../workflow";
import WorkflowsDialog from "./global/WorkflowsDialog";
import Main from "./main/Main";
import UserInput from "./main/UserInput";
import MobileToolbar from "./sidebar/MobileToolbar";
import Sidebar from "./sidebar/Sidebar";

function App() {
  const [currentWorkflow, setCurrentWorkflow] = useState(defaultWorkflow);
  const [variables, setVariables] = useState<Map<string, string>>(new Map());

  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const enableMemory = useAppSelector((state) => state.settings.enableMemory);
  const dispatch = useAppDispatch();

  const matchesLg = useMediaQuery((theme: Theme) => theme.breakpoints.up("lg"));
  const messageContainerRef = useRef<HTMLDivElement>(null);

  const executeWorkflowStepCallback = async () => {
    variables.set("MEMORIES", "");
    if (enableMemory) {
      await import("../tools/scheme");
      await fetch("tool://memories")
        .then(async (response) => {
          if (!response.ok) throw new Error("Failed to fetch memories");
          const memories = (await response.json()) as string[];
          variables.set(
            "MEMORIES",
            memories.map((memory, index) => `[${index}] ${memory}\n`).join("")
          );
        })
        .catch(() => {});
    }
  };
  const executeWorkflowStepRef = useRef(executeWorkflowStepCallback);
  executeWorkflowStepRef.current = executeWorkflowStepCallback;

  const handleNewChat = useCallback(() => {
    setVariables(new Map());
    setSidebarOpen(false);
    dispatch(setCurrentConversation(null));
    dispatch(abort());
  }, [dispatch]);

  const handleWorkflowChange = useCallback(
    (workflow: Workflow) => {
      setCurrentWorkflow(workflow);
      handleNewChat();
    },
    [handleNewChat]
  );

  return (
    <Stack direction="row" height="100%">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNewChat={handleNewChat}
      />
      <Stack sx={{ flexGrow: 1, minWidth: 0, overflow: "hidden" }}>
        {!matchesLg && (
          <MobileToolbar
            onMenuClick={() => setSidebarOpen(true)}
            onCreateThread={handleNewChat}
          />
        )}
        <Main messageContainerRef={messageContainerRef} />
        <Divider />
        <Container component="footer" maxWidth="md" sx={{ paddingX: 1 }}>
          <UserInput />
        </Container>
      </Stack>
      <WorkflowsDialog
        currentWorkflow={currentWorkflow}
        onWorkflowChange={handleWorkflowChange}
      />
    </Stack>
  );
}

export default App;
