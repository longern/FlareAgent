import { Container, Divider, Stack } from "@mui/material";
import React, { useCallback, useRef, useState } from "react";

import { abort } from "../app/abort";
import { setCurrentConversation } from "../app/conversations";
import { useAppDispatch } from "../app/hooks";
import { Workflow, defaultWorkflow } from "../workflow";
import { GlobalComponentsProvider } from "./global/GlobalComponents";
import WorkflowsDialog from "./global/WorkflowsDialog";
import FooterButtons from "./main/FooterButtons";
import Main from "./main/Main";
import UserInput from "./main/UserInput";
import MobileToolbar from "./sidebar/MobileToolbar";
import Sidebar from "./sidebar/Sidebar";

const footer = (
  <Container component="footer" maxWidth="md" sx={{ paddingX: 1 }}>
    <UserInput />
    <FooterButtons />
  </Container>
);

function App() {
  const [currentWorkflow, setCurrentWorkflow] = useState(defaultWorkflow);

  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const dispatch = useAppDispatch();

  const messageContainerRef = useRef<HTMLDivElement>(null);

  const handleWorkflowChange = useCallback(
    (workflow: Workflow) => {
      setCurrentWorkflow(workflow);
      setSidebarOpen(false);
      dispatch(setCurrentConversation(null));
      dispatch(abort());
    },
    [dispatch]
  );

  return (
    <GlobalComponentsProvider>
      <Stack direction="row" height="100%">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <Stack sx={{ flexGrow: 1, minWidth: 0, overflow: "hidden" }}>
          <MobileToolbar onMenuClick={() => setSidebarOpen(true)} />
          <Main messageContainerRef={messageContainerRef} />
          <Divider />
          {footer}
        </Stack>
        <WorkflowsDialog
          currentWorkflow={currentWorkflow}
          onWorkflowChange={handleWorkflowChange}
        />
      </Stack>
    </GlobalComponentsProvider>
  );
}

export default App;
