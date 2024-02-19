import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Card,
  Dialog,
  DialogContent,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  TextField,
  Theme,
  Toolbar,
  useMediaQuery,
} from "@mui/material";
import {
  AccountCircle as AccountCircleIcon,
  AirlineStops as AirlineStopsIcon,
  Close as CloseIcon,
  NavigateNext as NavigateNextIcon,
  Shield as ShieldIcon,
} from "@mui/icons-material";
import { SlideLeft } from "./SlideLeft";

function useApiKey() {
  const [apiKey, setApiKey] = useState<string | null>(null);

  useEffect(() => {
    const apiKey = localStorage.getItem("OPENAI_API_KEY");
    if (apiKey) {
      setApiKey(apiKey);
    }
  }, []);

  useEffect(() => {
    if (apiKey) {
      localStorage.setItem("OPENAI_API_KEY", apiKey);
    } else {
      localStorage.removeItem("OPENAI_API_KEY");
    }
  }, [apiKey]);

  return [apiKey, setApiKey] as const;
}

function AccountDialogContent() {
  const [apiKey, setApiKey] = useApiKey();
  const [baseUrl, setBaseUrl] = useState<string | null>(
    localStorage.getItem("OPENAI_BASE_URL") ?? null
  );

  const { t } = useTranslation();

  useEffect(() => {
    baseUrl
      ? localStorage.setItem("OPENAI_BASE_URL", baseUrl)
      : localStorage.removeItem("OPENAI_BASE_URL");
  }, [baseUrl]);

  return (
    <Stack spacing={2}>
      <TextField
        label={t("API Key")}
        value={apiKey ?? ""}
        onChange={(e) => setApiKey(e.target.value)}
      />
      <Stack direction="row" alignItems="center" spacing={1}>
        <TextField
          label={t("Base URL")}
          value={baseUrl ?? ""}
          fullWidth
          onChange={(e) => setBaseUrl(e.target.value)}
        />
        <Box>
          <IconButton
            aria-label="proxy"
            onClick={() => {
              const proxyUrl = new URL("/openai", window.location.href);
              setBaseUrl(proxyUrl.toString());
            }}
          >
            <AirlineStopsIcon />
          </IconButton>
        </Box>
      </Stack>
    </Stack>
  );
}

function SettingsForm() {
  const [activeTab, setActiveTab] = useState<string | null>(null);

  const { t } = useTranslation();
  const matchesLg = useMediaQuery((theme: Theme) => theme.breakpoints.up("lg"));

  useEffect(() => {
    if (activeTab === null && matchesLg) {
      setActiveTab("Account");
    }
  }, [activeTab, matchesLg]);

  const tabs = (
    <Card elevation={0}>
      <List disablePadding>
        <ListItem disablePadding>
          <ListItemButton
            selected={activeTab === "Account"}
            onClick={() => setActiveTab("Account")}
          >
            <ListItemIcon>
              <AccountCircleIcon />
            </ListItemIcon>
            <ListItemText primary={t("Account")} />
            <NavigateNextIcon />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton>
            <ListItemIcon>
              <ShieldIcon />
            </ListItemIcon>
            <ListItemText primary={t("Permissions")} />
            <NavigateNextIcon />
          </ListItemButton>
        </ListItem>
      </List>
    </Card>
  );

  const content = activeTab === "Account" ? <AccountDialogContent /> : null;

  return matchesLg ? (
    <Stack direction="row" spacing={2}>
      <Box width={300}>{tabs}</Box>
      <Box flexGrow={1}>{content}</Box>
    </Stack>
  ) : (
    <>
      {tabs}
      <Dialog
        open={activeTab !== null}
        onClose={() => setActiveTab(null)}
        fullScreen
        TransitionComponent={SlideLeft}
      >
        <Toolbar disableGutters>
          <IconButton
            size="large"
            color="inherit"
            onClick={() => setActiveTab(null)}
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
          <Box flexGrow={1} textAlign="center">
            {t(activeTab || "Settings")}
          </Box>
          <Box width={48} />
        </Toolbar>
        <DialogContent>{content}</DialogContent>
      </Dialog>
    </>
  );
}

function SettingsDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
      TransitionComponent={SlideLeft}
      PaperProps={{
        sx: {
          backgroundColor: (theme) =>
            theme.palette.mode === "dark" ? "#050505" : "#fafafa",
        },
      }}
    >
      <Toolbar disableGutters>
        <IconButton
          size="large"
          color="inherit"
          onClick={onClose}
          aria-label="close"
        >
          <CloseIcon />
        </IconButton>
        <Box flexGrow={1} textAlign="center">
          {t("Settings")}
        </Box>
        <Box width={48} />
      </Toolbar>
      <DialogContent sx={{ p: 2 }}>
        <SettingsForm />
      </DialogContent>
    </Dialog>
  );
}

export default SettingsDialog;
