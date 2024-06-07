import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  Stack,
  TextField,
  Box,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  ListItemButton,
  FormControl,
  MenuItem,
  Select,
  InputLabel,
} from "@mui/material";
import {
  AirlineStops as AirlineStopsIcon,
  Person as PersonIcon,
} from "@mui/icons-material";

import { useAppSelector } from "../../app/hooks";

async function signOut() {
  await fetch("/api/auth/signout", { method: "POST" });
  window.location.reload();
}

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

function AccountContent() {
  const userId = useAppSelector((state) => state.identity.id);
  const [apiKey, setApiKey] = useApiKey();
  const [baseUrl, setBaseUrl] = useState<string | null>(
    localStorage.getItem("OPENAI_BASE_URL")
  );
  const [modelProvider, setModelProvider] = useState<string | null>(
    baseUrl?.startsWith(window.location.origin)
      ? baseUrl.slice(window.location.origin.length + 1).replace(/\/v1\/?$/, "")
      : ""
  );

  const { t } = useTranslation();

  useEffect(() => {
    baseUrl
      ? localStorage.setItem("OPENAI_BASE_URL", baseUrl)
      : localStorage.removeItem("OPENAI_BASE_URL");
  }, [baseUrl]);

  const avatarUrl = useAppSelector((state) => state.identity.avatarUrl);

  return (
    <Stack spacing={2}>
      <Card elevation={0} component={List} disablePadding>
        <ListItem disablePadding>
          <ListItemButton>
            <ListItemAvatar>
              <Avatar src={avatarUrl}>
                <PersonIcon />
              </Avatar>
            </ListItemAvatar>
            <ListItemText primary={userId ?? t("Sign in")} />
          </ListItemButton>
        </ListItem>
      </Card>
      <Card elevation={0} component={List}>
        {userId && (
          <ListItem>
            <FormControl variant="standard" fullWidth>
              <InputLabel id="model-provider-label" shrink>
                {t("Model provider")}
              </InputLabel>
              <Select
                labelId="model-provider-label"
                id="model-provider"
                value={modelProvider}
                onChange={(e) => {
                  setModelProvider(e.target.value as string);
                  if (e.target.value !== "") {
                    setBaseUrl(
                      `${window.location.origin}/${e.target.value}/v1`
                    );
                  }
                }}
                label={t("Model provider")}
                displayEmpty
              >
                <MenuItem value={""}>{t("Custom model")}</MenuItem>
                <MenuItem value="openai">openai</MenuItem>
                <MenuItem value="gemini">gemini</MenuItem>
                <MenuItem value="meta">meta</MenuItem>
                <MenuItem value="qwen">qwen</MenuItem>
              </Select>
            </FormControl>
          </ListItem>
        )}
        {(!userId || !modelProvider) && (
          <React.Fragment>
            <ListItem>
              <TextField
                variant="standard"
                label={t("API Key")}
                value={apiKey ?? ""}
                fullWidth
                onChange={(e) => setApiKey(e.target.value)}
              />
            </ListItem>
            <ListItem>
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ width: "100%" }}
              >
                <TextField
                  variant="standard"
                  label={t("Base URL")}
                  value={baseUrl ?? ""}
                  fullWidth
                  onChange={(e) => setBaseUrl(e.target.value)}
                />
                <Box>
                  <IconButton
                    aria-label="proxy"
                    onClick={() => {
                      const proxyUrl = new URL(
                        "/openai/v1",
                        window.location.href
                      );
                      setBaseUrl(proxyUrl.toString());
                    }}
                  >
                    <AirlineStopsIcon />
                  </IconButton>
                </Box>
              </Stack>
            </ListItem>
          </React.Fragment>
        )}
      </Card>
      {userId && (
        <Card elevation={0} component={List} disablePadding>
          <ListItem disablePadding>
            <ListItemButton onClick={signOut}>
              <ListItemText primary={t("Sign out")} />
            </ListItemButton>
          </ListItem>
        </Card>
      )}
    </Stack>
  );
}

export default AccountContent;
