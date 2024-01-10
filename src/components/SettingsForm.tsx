import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Box, IconButton, Stack, TextField } from "@mui/material";
import { AirlineStops as AirlineStopsIcon } from "@mui/icons-material";

function useApiKey() {
  const [apiKey, setApiKey] = React.useState<string | null>(null);

  React.useEffect(() => {
    const apiKey = localStorage.getItem("openaiApiKey");
    if (apiKey) {
      setApiKey(apiKey);
    }
  }, []);

  React.useEffect(() => {
    if (apiKey) {
      localStorage.setItem("openaiApiKey", apiKey);
    } else {
      localStorage.removeItem("openaiApiKey");
    }
  }, [apiKey]);

  return [apiKey, setApiKey] as const;
}

function SettingsForm() {
  const [apiKey, setApiKey] = useApiKey();
  const [baseUrl, setBaseUrl] = React.useState<string | null>(
    localStorage.getItem("openaiBaseUrl") ?? null
  );

  const { t } = useTranslation();

  useEffect(() => {
    baseUrl
      ? localStorage.setItem("openaiBaseUrl", baseUrl)
      : localStorage.removeItem("openaiBaseUrl");
  }, [baseUrl]);

  return (
    <Stack spacing={2} py={2}>
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

export default SettingsForm;
