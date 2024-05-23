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
import { useAppDispatch } from "../../app/hooks";

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
}: {
  children: React.ReactNode;
  caption: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Stack sx={{ alignItems: "center", gap: "4px" }}>
      <Card elevation={0}>
        <CardActionArea onClick={onClick}>
          <CardContent>{children}</CardContent>
        </CardActionArea>
      </Card>
      <Typography variant="caption">{caption}</Typography>
    </Stack>
  );
}

function FooterButtons() {
  const [images, setImages] = useState<string[]>([]);
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
        setImages(images);
      }
    };
    input.click();
  }, []);

  const handleTakePhoto = useCallback((event: React.MouseEvent) => {
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
        setImages(images);
      }
    };
    input.click();
  }, []);

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
