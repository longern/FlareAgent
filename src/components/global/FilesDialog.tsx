import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { connect } from "react-redux";
import {
  Box,
  Breadcrumbs,
  IconButton,
  Link,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
} from "@mui/material";
import {
  AudioFile as AudioFileIcon,
  CreateNewFolder as CreateNewFolderIcon,
  Description as DescriptionIcon,
  FileUpload as FileUploadIcon,
  Folder as FolderIcon,
  Image as ImageIcon,
  InsertDriveFile as InsertDriveFileIcon,
  MoreVert as MoreVertIcon,
  VideoFile as VideoFileIcon,
} from "@mui/icons-material";

import { DIRECTORY } from "../../fs/hooks";
import { HistoryDialog } from "./HistoryDialog";
import { hideFiles } from "../../app/dialogs";
import { AppState } from "../../app/store";

function humanFileSize(size: number) {
  var i = size === 0 ? 0 : Math.floor(Math.log(size) / Math.log(1024));
  return (
    Number((size / Math.pow(1024, i)).toFixed(2)) +
    " " +
    ["B", "kB", "MB", "GB", "TB"][i]
  );
}

function FileTypeIcon({ fileType }: { fileType: string }) {
  return fileType.startsWith("audio/") ? (
    <AudioFileIcon />
  ) : fileType.startsWith("image/") ? (
    <ImageIcon />
  ) : fileType.startsWith("text/") ? (
    <DescriptionIcon />
  ) : fileType.startsWith("video/") ? (
    <VideoFileIcon />
  ) : (
    <InsertDriveFileIcon />
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
    disabled?: boolean;
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
        <ListItemButton onClick={onClick} onContextMenu={handleContextMenu}>
          <ListItemIcon>
            <FileTypeIcon fileType={file.type} />
          </ListItemIcon>
          <ListItemText
            primary={file.name}
            primaryTypographyProps={{
              sx: { overflowWrap: "anywhere" },
            }}
            secondary={
              <Stack component="span" direction="row" spacing={2}>
                <span>{new Date(file.lastModified).toLocaleString()}</span>
                <span>{humanFileSize(file.size)}</span>
              </Stack>
            }
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
            disabled={item.disabled}
            sx={{ minWidth: 160 }}
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

async function listDirectory(dirHandle: FileSystemDirectoryHandle) {
  const files: ({ name: string } | File)[] = [];
  for await (const [, value] of dirHandle as unknown as AsyncGenerator<
    [string, FileSystemFileHandle | FileSystemDirectoryHandle]
  >) {
    files.push(
      value.kind === "file" ? await value.getFile() : { name: value.name }
    );
  }

  // Put directories first and sort alphabetically
  files.sort((a, b) =>
    a instanceof File
      ? b instanceof File
        ? a.name.localeCompare(b.name)
        : 1
      : b instanceof File
      ? -1
      : a.name.localeCompare(b.name)
  );

  return files;
}

function PathBreadcrumbs({
  path,
  setDirHandle,
}: {
  path: string[];
  setDirHandle: (handle: FileSystemDirectoryHandle) => void;
}) {
  const { t } = useTranslation();

  return (
    <Breadcrumbs sx={{ px: 2, py: 1.5 }} maxItems={3} itemsAfterCollapse={2}>
      <Link
        component="button"
        underline="none"
        color={path.length === 0 ? "inherit" : undefined}
        disabled={path.length === 0}
        onClick={() => DIRECTORY.then(setDirHandle)}
      >
        {t("My Files")}
      </Link>
      {path.map((name, index) =>
        index === path.length - 1 ? (
          <Box key={index} component="span">
            {name}
          </Box>
        ) : (
          <Link
            key={index}
            component="button"
            underline="none"
            onClick={() => {
              const handle = path
                .slice(0, index + 1)
                .reduce(
                  (handle, name) =>
                    handle.then((handle) => handle.getDirectoryHandle(name)),
                  DIRECTORY
                );
              handle.then(setDirHandle);
            }}
          >
            {name}
          </Link>
        )
      )}
    </Breadcrumbs>
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
  const [path, setPath] = useState<string[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const { t } = useTranslation();

  const readDirectory = useCallback(
    (dirHandle: FileSystemDirectoryHandle) =>
      listDirectory(dirHandle).then(async (files) => {
        const root = await DIRECTORY;
        if (root === dirHandle) {
          const index = files.findIndex((file) => file.name === ".flareagent");
          if (index !== -1) files.splice(index, 1);
        }
        setFiles(files);
      }),
    []
  );

  const handleImportFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!dirHandle) return;
      const input = e.target as HTMLInputElement;
      if (!input.files) return;
      await Promise.all(
        Array.from(input.files).map(async (file) => {
          const fileHandle = await dirHandle.getFileHandle(file.name, {
            create: true,
          });
          const writable = await fileHandle.createWritable();
          await writable.write(file);
          await writable.close();
        })
      );
      readDirectory(dirHandle);
    },
    [dirHandle, readDirectory]
  );

  useEffect(() => {
    if (dirHandle === null) return;
    readDirectory(dirHandle);
    DIRECTORY.then((root) => {
      root.resolve(dirHandle).then(setPath);
    });
  }, [dirHandle, readDirectory]);

  useEffect(() => {
    if (!open) return setDirHandle(null);
    if (!navigator.storage) return setStorageNotSupported(true);
    DIRECTORY.then(setDirHandle);
  }, [open]);

  return (
    <HistoryDialog
      hash="files"
      title={t("My Files")}
      endAdornment={
        <>
          <IconButton
            size="large"
            color="inherit"
            onClick={(event) => setAnchorEl(event.currentTarget)}
            aria-label={t("More")}
          >
            <MoreVertIcon />
          </IconButton>
          <Menu
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
            anchorEl={anchorEl}
            MenuListProps={{ disablePadding: true }}
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
              <ListItemIcon>
                <CreateNewFolderIcon />
              </ListItemIcon>
              {t("New directory")}
            </MenuItem>
            <MenuItem component="label">
              <ListItemIcon>
                <FileUploadIcon />
              </ListItemIcon>
              {t("Import file")}
              <input type="file" hidden multiple onChange={handleImportFile} />
            </MenuItem>
          </Menu>
        </>
      }
      open={open}
      onClose={onClose}
    >
      <PathBreadcrumbs path={path} setDirHandle={setDirHandle} />

      {storageNotSupported ? (
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          {t("Storage not supported")}
        </Box>
      ) : files.length === 0 ? (
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          {t("No files")}
        </Box>
      ) : (
        <List disablePadding sx={{ overflow: "auto" }}>
          {files.map((file) => {
            async function open() {
              if (file instanceof File) {
                const url = URL.createObjectURL(file);
                window.open(url);
                return;
              }
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
                    label: t("Rename"),
                    disabled: !(file instanceof File),
                    onClick: async () => {
                      if (!(file instanceof File) || !dirHandle) return;
                      const name = window.prompt(t("New name"), file.name);
                      if (!name || name === file.name) return;
                      const newFileHandle = await dirHandle.getFileHandle(
                        name,
                        { create: true }
                      );
                      const writable = await newFileHandle.createWritable();
                      await writable.write(file);
                      await writable.close();
                      await dirHandle.removeEntry(file.name);
                      await readDirectory(dirHandle);
                    },
                  },
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
    </HistoryDialog>
  );
}

export default connect(
  (state: AppState) => ({
    open: state.dialogs.files,
  }),
  (dispatch) => ({
    onClose: () => dispatch(hideFiles()),
  })
)(FilesDialog);
