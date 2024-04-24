import { Snackbar } from "@mui/material";
import React from "react";

import { useAppDispatch, useAppSelector } from "../app/hooks";
import { hideError } from "../app/error";

export function ErrorDisplay() {
  const message = useAppSelector((state) => state.error.message);
  const dispatch = useAppDispatch();

  const onClose = () => dispatch(hideError());

  return (
    <Snackbar
      color="error"
      open={message !== null}
      onClose={onClose}
      message={message}
    />
  );
}
