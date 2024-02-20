import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Card,
  Container,
  DialogContent,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  TextField,
  Theme,
  styled,
  useMediaQuery,
} from "@mui/material";
import {
  AccountCircle as AccountCircleIcon,
  AirlineStops as AirlineStopsIcon,
  Cancel as CancelIcon,
  Check as CheckIcon,
  CheckCircle as CheckCircleIcon,
  Help as HelpIcon,
  Lock as LockIcon,
  NavigateNext as NavigateNextIcon,
  Tune as TuneIcon,
} from "@mui/icons-material";
import { HistoryDialog } from "./HistoryDialog";

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

const SparseList = styled(List)(() => ({
  padding: 0,
  "& .MuiListItemButton-root": { minHeight: 60 },
}));

function AccountContent() {
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

function GeneralContent() {
  const [languageOpen, setLanguageOpen] = useState(false);

  const { t, i18n } = useTranslation();

  function getDisplayName(code: string, locale: string) {
    try {
      return new Intl.DisplayNames([locale], { type: "language" }).of(code);
    } catch (e) {
      return code;
    }
  }

  const handleLanguageClose = useCallback(() => {
    setLanguageOpen(false);
  }, []);

  return (
    <>
      <Card elevation={0}>
        <SparseList>
          <ListItem disablePadding>
            <ListItemButton onClick={() => setLanguageOpen(true)}>
              <ListItemText
                primary={t("Language")}
                secondary={
                  i18n.language.endsWith("-default")
                    ? t("System default")
                    : getDisplayName(i18n.language, i18n.language)
                }
              />
              <NavigateNextIcon />
            </ListItemButton>
          </ListItem>
        </SparseList>
      </Card>
      <HistoryDialog
        hash="language"
        title={t("Language")}
        open={languageOpen}
        onClose={handleLanguageClose}
      >
        <DialogContent>
          <Card elevation={0}>
            <SparseList>
              <ListItem disablePadding>
                <ListItemButton onClick={() => i18n.changeLanguage()}>
                  <ListItemText primary={t("System default")} />
                  {i18n.language.endsWith("-default") && (
                    <CheckIcon color="success" />
                  )}
                </ListItemButton>
              </ListItem>
              {Object.keys(i18n.options.resources).map((language) => (
                <ListItem key={language} disablePadding>
                  <ListItemButton onClick={() => i18n.changeLanguage(language)}>
                    <ListItemText
                      primary={getDisplayName(language, language)}
                    />
                    {i18n.language === language && (
                      <CheckIcon color="success" />
                    )}
                  </ListItemButton>
                </ListItem>
              ))}
            </SparseList>
          </Card>
        </DialogContent>
      </HistoryDialog>
    </>
  );
}

function PermissionIcon({ state }: { state: PermissionState | null }) {
  switch (state) {
    case "granted":
      return <CheckCircleIcon color="success" />;
    case "denied":
      return <CancelIcon color="error" />;
    case "prompt":
      return <HelpIcon color="primary" />;
    default:
      return null;
  }
}

const PERMISSIONS = [
  "geolocation",
  "notifications",
  "camera",
  "microphone",
  "accelerometer",
  "magnetometer",
  "clipboard-read",
  "clipboard-write",
] as PermissionName[];

const PERMISSION_REQUESTERS = {
  geolocation: () => navigator.geolocation.getCurrentPosition(() => {}),
  notifications: () => Notification.requestPermission(),
  camera: () =>
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => stream.getTracks().forEach((track) => track.stop())),
  microphone: () =>
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => stream.getTracks().forEach((track) => track.stop())),
  "clipboard-read": () => navigator.clipboard.readText(),
};

function PermissionsContent() {
  const [permissions, setPermissions] = useState<
    Partial<Record<PermissionName, PermissionState | null>>
  >(Object.fromEntries(PERMISSIONS.map((name) => [name, null] as const)));

  const { t } = useTranslation();

  useEffect(() => {
    Promise.allSettled(
      PERMISSIONS.map(async (name: PermissionName) => {
        const status = await navigator.permissions.query({ name });
        return [name, status.state] as const;
      })
    ).then((results) => {
      setPermissions(
        Object.fromEntries(
          results.flatMap((result) =>
            result.status === "fulfilled" ? [result.value] : []
          )
        )
      );
    });
  }, []);

  function requestPermission(name: PermissionName) {
    if (!(name in PERMISSION_REQUESTERS)) return;
    PERMISSION_REQUESTERS[name]()
      .catch(() => {})
      .finally(() => {
        navigator.permissions.query({ name }).then((status) => {
          setPermissions((permissions) => ({
            ...permissions,
            [name]: status.state,
          }));
        });
      });
  }

  return (
    <Card elevation={0}>
      <SparseList>
        {Object.entries(permissions).map(
          ([name, state]: [PermissionName, PermissionState | null]) => (
            <ListItem key={name} disablePadding>
              <ListItemButton
                onClick={() => state === "prompt" && requestPermission(name)}
              >
                <ListItemText
                  primary={t(
                    name
                      .replaceAll("-", " ")
                      .replace(/^./, (ch) => ch.toUpperCase())
                  )}
                />
                <PermissionIcon state={state} />
              </ListItemButton>
            </ListItem>
          )
        )}
      </SparseList>
    </Card>
  );
}

function SettingsForm() {
  type TabName = "Account" | "Permissions" | "General";
  const [activeTab, setActiveTab] = useState<TabName | null>(null);

  const { t } = useTranslation();
  const matchesLg = useMediaQuery((theme: Theme) => theme.breakpoints.up("lg"));

  useEffect(() => {
    if (activeTab === null && matchesLg) {
      setActiveTab("Account");
    }
  }, [activeTab, matchesLg]);

  const handleTabClose = useCallback(() => {
    setActiveTab(null);
  }, []);

  const tabs = (
    <Card elevation={0}>
      <SparseList>
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
        <Divider variant="inset" component="li" />
        <ListItem disablePadding>
          <ListItemButton
            selected={activeTab === "General"}
            onClick={() => setActiveTab("General")}
          >
            <ListItemIcon>
              <TuneIcon />
            </ListItemIcon>
            <ListItemText primary={t("General")} />
            <NavigateNextIcon />
          </ListItemButton>
        </ListItem>
        <Divider variant="inset" component="li" />
        <ListItem disablePadding>
          <ListItemButton
            selected={activeTab === "Permissions"}
            onClick={() => setActiveTab("Permissions")}
          >
            <ListItemIcon>
              <LockIcon />
            </ListItemIcon>
            <ListItemText primary={t("Permissions")} />
            <NavigateNextIcon />
          </ListItemButton>
        </ListItem>
      </SparseList>
    </Card>
  );

  const content =
    activeTab === "Account" ? (
      <AccountContent />
    ) : activeTab === "General" ? (
      <GeneralContent />
    ) : activeTab === "Permissions" ? (
      <PermissionsContent />
    ) : null;

  return matchesLg ? (
    <Stack direction="row" spacing={2}>
      <Box width={300}>{tabs}</Box>
      <Box flexGrow={1}>
        <Container maxWidth="md">{content}</Container>
      </Box>
    </Stack>
  ) : (
    <>
      {tabs}
      <HistoryDialog
        hash={activeTab || ""}
        title={t(activeTab || "Settings")}
        open={activeTab !== null}
        onClose={handleTabClose}
      >
        <DialogContent sx={{ p: 2 }}>{content}</DialogContent>
      </HistoryDialog>
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
    <HistoryDialog
      hash="settings"
      title={t("Settings")}
      open={open}
      onClose={onClose}
    >
      <DialogContent sx={{ p: 2 }}>
        <SettingsForm />
      </DialogContent>
    </HistoryDialog>
  );
}

export default SettingsDialog;
