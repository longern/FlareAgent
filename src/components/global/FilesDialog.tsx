import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  AppBar,
  Box,
  Dialog,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
} from "@mui/material";
import {
  Close as CloseIcon,
  Folder as FolderIcon,
  InsertDriveFile as InsertDriveFileIcon,
  MoreVert as MoreVertIcon,
} from "@mui/icons-material";

function humanFileSize(size: number) {
  var i = size === 0 ? 0 : Math.floor(Math.log(size) / Math.log(1024));
  return (
    Number((size / Math.pow(1024, i)).toFixed(2)) +
    " " +
    ["B", "kB", "MB", "GB", "TB"][i]
  );
}

function FilesListItem({
  file,
  onClick,
  contextMenu,
}: {
  file: { name: string } | File;
  onClick: () => void;
  contextMenu?: {
    label: string;
    onClick: () => void;
  }[];
}) {
  const [menuPosition, setMenuPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  function handleContextMenu(event: React.MouseEvent<HTMLElement>) {
    setMenuPosition(
      menuPosition === null ? { x: event.clientX, y: event.clientY } : null
    );
    event.preventDefault();
  }

  return (
    <ListItem key={file.name} disablePadding>
      {file instanceof File ? (
        <ListItemButton onContextMenu={handleContextMenu}>
          <ListItemIcon>
            <InsertDriveFileIcon />
          </ListItemIcon>
          <ListItemText
            primary={file.name}
            primaryTypographyProps={{
              sx: { overflowWrap: "anywhere" },
            }}
            secondary={
              <Stack direction="row" spacing={2}>
                <span>{new Date(file.lastModified).toLocaleString()}</span>
                <span>{humanFileSize(file.size)}</span>
              </Stack>
            }
            secondaryTypographyProps={{
              component: "div",
            }}
          />
        </ListItemButton>
      ) : (
        <ListItemButton onClick={onClick} onContextMenu={handleContextMenu}>
          <ListItemIcon>
            <FolderIcon />
          </ListItemIcon>
          <ListItemText primary={file.name} />
        </ListItemButton>
      )}
      <Menu
        open={menuPosition !== null}
        onClose={() => setMenuPosition(null)}
        anchorReference="anchorPosition"
        anchorPosition={
          menuPosition
            ? { top: menuPosition.y, left: menuPosition.x }
            : undefined
        }
      >
        {contextMenu?.map((item) => (
          <MenuItem
            key={item.label}
            onClick={() => {
              item.onClick();
              setMenuPosition(null);
            }}
          >
            {item.label}
          </MenuItem>
        ))}
      </Menu>
    </ListItem>
  );
}

function FilesDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [files, setFiles] = useState<({ name: string } | File)[]>([]);
  const [storageNotSupported, setStorageNotSupported] = useState(false);
  const [dirHandle, setDirHandle] = useState<FileSystemDirectoryHandle | null>(
    null
  );
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const { t } = useTranslation();

  const readDirectory = useCallback(
    async (dirHandle: FileSystemDirectoryHandle) => {
      const files = [];
      for await (const [, value] of dirHandle as unknown as AsyncGenerator<
        [string, FileSystemFileHandle | FileSystemDirectoryHandle]
      >) {
        files.push(
          value.kind === "file" ? await value.getFile() : { name: value.name }
        );
      }
      setFiles(files);
    },
    []
  );

  useEffect(() => {
    if (dirHandle === null) return;
    readDirectory(dirHandle);
  }, [dirHandle, readDirectory]);

  useEffect(() => {
    if (!open) return;
    if (!navigator.storage) return setStorageNotSupported(true);
    navigator.storage.getDirectory().then((root) => {
      setDirHandle(root);
    });
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} fullScreen>
      <AppBar position="relative">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={onClose}
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
          <Box flexGrow={1} textAlign="center">
            {t("My Files")}
          </Box>
          <IconButton
            edge="end"
            color="inherit"
            onClick={(event) => setAnchorEl(event.currentTarget)}
            aria-label="menu"
          >
            <MoreVertIcon />
          </IconButton>
          <Menu
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
            anchorEl={anchorEl}
          >
            <MenuItem
              onClick={async () => {
                const name = window.prompt(t("Directory name"));
                if (!name) return;
                await dirHandle?.getDirectoryHandle(name, { create: true });
                setAnchorEl(null);
                await readDirectory(dirHandle!);
              }}
            >
              {t("New directory")}
            </MenuItem>
            <MenuItem
              onClick={async () => {
                if (!dirHandle) return;
                const input = document.createElement("input");
                input.type = "file";
                input.multiple = true;
                input.onchange = async () => {
                  if (!input.files) return;
                  await Promise.all(
                    Array.from(input.files).map(async (file) => {
                      const fileHandle = await dirHandle.getFileHandle(
                        file.name,
                        { create: true }
                      );
                      const writable = await fileHandle.createWritable();
                      await writable.write(file);
                      await writable.close();
                    })
                  );
                  await readDirectory(dirHandle);
                };
                input.click();
                setAnchorEl(null);
              }}
            >
              {t("Import file")}
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      {storageNotSupported ? (
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          {t("Storage not supported")}
        </Box>
      ) : files.length === 0 ? (
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          {t("No files")}
        </Box>
      ) : (
        <List disablePadding>
          {files.map((file) => {
            async function open() {
              if (file instanceof File) return;
              const handle = await dirHandle?.getDirectoryHandle(file.name);
              if (handle) setDirHandle(handle);
            }

            return (
              <FilesListItem
                key={file.name}
                file={file}
                onClick={open}
                contextMenu={[
                  { label: t("Open"), onClick: open },
                  {
                    label: t("Delete"),
                    onClick: async () => {
                      await dirHandle!.removeEntry(file.name, {
                        recursive: true,
                      });
                      await readDirectory(dirHandle!);
                    },
                  },
                ]}
              />
            );
          })}
        </List>
      )}
    </Dialog>
  );
}

export default FilesDialog;
