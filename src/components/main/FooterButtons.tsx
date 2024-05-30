import {
  AddCircleOutline as AddCircleOutlineIcon,
  CameraAlt as CameraAltIcon,
  Extension as ExtensionIcon,
  Folder as FolderIcon,
  Image as ImageIcon,
  Phone as PhoneIcon,
  Timeline as TimelineIcon,
} from "@mui/icons-material";
import {
  Badge,
  Card,
  CardActionArea,
  CardContent,
  Collapse,
  IconButton,
  Stack,
  Theme,
  Typography,
} from "@mui/material";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  showFiles,
  showTools,
  showVoiceCall,
  showWorkflows,
} from "../../app/dialogs";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { AppState } from "../../app/store";
import { setInputImages } from "../../app/inputImages";

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    return reader.readAsDataURL(blob);
  });
}

function CaptionButton({
  children,
  caption,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  caption: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const colorFunction = disabled
    ? (theme: Theme) => theme.palette.text.disabled
    : undefined;
  return (
    <Stack sx={{ alignItems: "center", gap: "4px" }}>
      <Card elevation={0} sx={{ color: colorFunction }}>
        <CardActionArea onClick={onClick} disabled={disabled}>
          <CardContent>{children}</CardContent>
        </CardActionArea>
      </Card>
      <Typography variant="caption" sx={{ color: colorFunction }}>
        {caption}
      </Typography>
    </Stack>
  );
}

function FooterButtons() {
  const images = useAppSelector((state: AppState) => state.inputImages.images);
  const [expanded, setExpanded] = useState<boolean>(false);
  const dispatch = useAppDispatch();

  const { t } = useTranslation();

  const handleImportImage = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = true;
    input.onchange = async () => {
      if (input.files) {
        const files = Array.from(input.files);
        const images = await Promise.all(
          files.map((file) => blobToDataUrl(file))
        );
        dispatch(setInputImages(images));
      }
    };
    input.click();
  }, [dispatch]);

  const handleTakePhoto = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.capture = "environment";
      input.onchange = async () => {
        if (input.files) {
          const files = Array.from(input.files);
          const images = await Promise.all(
            files.map((file) => blobToDataUrl(file))
          );
          dispatch(setInputImages(images));
        }
      };
      input.click();
    },
    [dispatch]
  );

  return (
    <React.Fragment>
      <Stack
        direction="row"
        justifyContent="space-around"
        sx={{ marginTop: -0.5, marginBottom: 0.5 }}
      >
        <IconButton
          aria-label="phone"
          onClick={() => dispatch(showVoiceCall())}
        >
          <PhoneIcon />
        </IconButton>
        <Badge badgeContent={images.length} color="primary" overlap="circular">
          <IconButton
            aria-label={t("Import image")}
            onClick={handleImportImage}
          >
            <ImageIcon />
          </IconButton>
        </Badge>
        <IconButton aria-label={t("Take photo")} onClick={handleTakePhoto}>
          <CameraAltIcon />
        </IconButton>
        <IconButton aria-label="tools" onClick={() => dispatch(showTools())}>
          <ExtensionIcon />
        </IconButton>
        <IconButton aria-label="expand" onClick={() => setExpanded(!expanded)}>
          <AddCircleOutlineIcon />
        </IconButton>
      </Stack>
      <Collapse in={expanded}>
        <Stack
          sx={{
            padding: 4,
            flexDirection: "row",
            justifyContent: "space-evenly",
          }}
        >
          <CaptionButton
            caption={t("Workflow")}
            onClick={() => dispatch(showWorkflows())}
          >
            <TimelineIcon />
          </CaptionButton>
          <CaptionButton
            caption={t("Files")}
            onClick={() => dispatch(showFiles())}
          >
            <FolderIcon />
          </CaptionButton>
        </Stack>
      </Collapse>
    </React.Fragment>
  );
}

export default FooterButtons;
