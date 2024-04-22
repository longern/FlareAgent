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
import jwt from "@tsndr/cloudflare-worker-jwt";

import { useAvatarUrl } from "../ActionsProvider";

function authenticate(
  challenge: string,
  providerOrigin: string,
  options?: { timeout?: number }
) {
  return new Promise<{
    name: string;
    id: string;
    response: {
      clientDataJSON: string;
      signature: string;
      publicKey: string;
    };
  }>((resolve, reject) => {
    const timeout = options?.timeout;
    const childWindow = window.open(providerOrigin);
    if (!childWindow) return;
    const interval = setInterval(() => {
      if (childWindow.closed) {
        clearInterval(interval);
        window.removeEventListener("message", messageHandler);
        reject(new Error("Window closed"));
      }
      childWindow.postMessage(
        { publicKey: { challenge, origin: window.location.origin } },
        "*"
      );
    }, 500);

    const messageHandler = async (event: MessageEvent) => {
      if (event.origin !== providerOrigin) return;
      if (event.data.type === "public-key") {
        clearInterval(interval);
        window.removeEventListener("message", messageHandler);
        resolve(event.data);
      }
    };

    window.addEventListener("message", messageHandler);

    if (!timeout) return;
    setTimeout(() => {
      if (childWindow.closed) return;
      childWindow.close();
      clearInterval(interval);
      window.removeEventListener("message", messageHandler);
      reject(new Error("Timeout"));
    }, timeout * 1000);
  });
}

async function challengeAuthenticate() {
  const challengeResponse = await fetch("/auth/challenge", {
    method: "POST",
  });
  const challengeJson = await challengeResponse.json();
  const { challenge } = challengeJson as { challenge: string };
  const cred = await authenticate(challenge, "https://auth.longern.com");
  const tokenResponse = await fetch("/auth/verify", {
    method: "POST",
    body: JSON.stringify(cred),
  });
  const tokenJson: { token: string } | { error: string } =
    await tokenResponse.json();
  if ("error" in tokenJson) return alert(tokenJson.error);
  const { token } = tokenJson;
  localStorage.setItem("OPENAI_API_KEY", token);
  localStorage.setItem(
    "OPENAI_BASE_URL",
    `${window.location.origin}/openai/v1`
  );
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

function decodeToken(token: string) {
  try {
    return jwt.decode(token).payload as any;
  } catch (e) {
    return null;
  }
}

function AccountContent() {
  const [apiKey, setApiKey] = useApiKey();
  const [baseUrl, setBaseUrl] = useState<string | null>(
    localStorage.getItem("OPENAI_BASE_URL") ?? null
  );
  const [modelProvider, setModelProvider] = useState<string | null>(
    baseUrl.startsWith(window.location.origin)
      ? baseUrl.slice(window.location.origin.length + 1).replace(/\/v1\/?$/, "")
      : ""
  );

  const { t } = useTranslation();

  useEffect(() => {
    baseUrl
      ? localStorage.setItem("OPENAI_BASE_URL", baseUrl)
      : localStorage.removeItem("OPENAI_BASE_URL");
  }, [baseUrl]);

  const avatarUrl = useAvatarUrl();

  const decodedToken = decodeToken(apiKey ?? "");
  const userId =
    decodedToken?.exp === undefined || decodedToken.exp >= Date.now() / 1000
      ? decodedToken?.id
      : undefined;

  return (
    <Stack spacing={2}>
      <Card elevation={0} component={List} disablePadding>
        <ListItem disablePadding>
          <ListItemButton onClick={challengeAuthenticate}>
            <ListItemAvatar>
              <Avatar src={avatarUrl}>
                <PersonIcon />
              </Avatar>
            </ListItemAvatar>
            <ListItemText primary={userId} />
          </ListItemButton>
        </ListItem>
      </Card>
      <Card elevation={0} component={List}>
        {userId && (
          <ListItem>
            <FormControl variant="standard" fullWidth>
              <InputLabel id="model-provider-label">
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
              >
                <MenuItem value={""}>{t("Custom model")}</MenuItem>
                <MenuItem value="openai">openai</MenuItem>
                <MenuItem value="meta">meta</MenuItem>
                <MenuItem value="qwen">qwen</MenuItem>
              </Select>
            </FormControl>
          </ListItem>
        )}
        {!modelProvider && (
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
    </Stack>
  );
}

export default AccountContent;
