import React, { useCallback } from "react";
import { connect } from "react-redux";
import { useTranslation } from "react-i18next";
import { Button, Container, Dialog, Stack } from "@mui/material";

import { AppState } from "../../app/store";
import { hideSignIn } from "../../app/dialogs";
import { fetchIdentity } from "../../app/identity";
import { useAppDispatch } from "../../app/hooks";

function authenticate(challenge: string, providerOrigin: string) {
  const searchParams = new URLSearchParams();
  searchParams.set("challenge", challenge);
  searchParams.set("callback_url", window.location.origin);
  const providerUrl = `${providerOrigin}?${searchParams.toString()}`;
  window.open(providerUrl);
}

async function challengeAuthenticate() {
  const challengeResponse = await fetch("/api/auth/challenge", {
    method: "POST",
  });
  const challengeJson = await challengeResponse.json();
  const { challenge } = challengeJson as { challenge: string };
  authenticate(challenge, "https://auth.longern.com");
}

declare const process: { env: { REACT_APP_QUOTA_RESELLER_URL?: string } };

function SignInDialog({ open }: { open: boolean }) {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const handleSignIn = useCallback(() => {
    challengeAuthenticate();
    const interval = setInterval(async () => {
      const action = await dispatch(fetchIdentity());
      if (action.meta.requestStatus === "fulfilled") {
        clearInterval(interval);
        dispatch(hideSignIn());
      }
    }, 5000);
  }, [dispatch]);

  return (
    <Dialog open={open} fullScreen>
      <Container
        maxWidth="xs"
        sx={{
          height: "100%",
          padding: 4,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Button
          variant="contained"
          size="large"
          color="primary"
          fullWidth
          onClick={handleSignIn}
        >
          {t("Sign in")}
        </Button>
        <Stack spacing={2} direction="row">
          {process.env.REACT_APP_QUOTA_RESELLER_URL && (
            <Button
              variant="text"
              size="large"
              href={process.env.REACT_APP_QUOTA_RESELLER_URL}
              target="_blank"
            >
              {t("Buy your own quota")}
            </Button>
          )}
          <Button
            variant="text"
            size="large"
            onClick={() => dispatch(hideSignIn())}
          >
            {t("Skip")}
          </Button>
        </Stack>
      </Container>
    </Dialog>
  );
}

export default connect((state: AppState) => ({
  open: state.dialogs.signIn,
}))(SignInDialog);
