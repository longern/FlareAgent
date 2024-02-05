import { useEffect } from "react";

export const DIRECTORY = navigator.storage?.getDirectory
  ? navigator.storage.getDirectory()
  : Promise.resolve<undefined>(undefined);

export async function pathToFileHandle(
  path: string,
  options?: { home?: string; create?: boolean }
) {
  options = options ?? {};
  const home = options.home ?? "/";
  const create = options.create ?? false;
  const directories = path
    .replace(new RegExp(`^${home.replace("/", "\\/")}/?`), "")
    .split("/");
  const filename = directories.pop();
  const directory = await directories.reduce(
    (promise, dirName) =>
      promise.then((directory) =>
        directory.getDirectoryHandle(dirName, { create })
      ),
    DIRECTORY
  );
  const fileHandle = await directory.getFileHandle(filename, { create });
  return fileHandle;
}

export async function readFile(path: string, options?: { home?: string }) {
  const fileHandle = await pathToFileHandle(path, options);
  const file = await fileHandle.getFile();
  return file;
}

export async function writeFile(
  path: string,
  contents: FileSystemWriteChunkType,
  options?: { home?: string }
) {
  const home = options?.home ?? "/";
  const fileHandle = await pathToFileHandle(path, { home, create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(contents);
  await writable.close();
}

export function useSyncFS<T = any>({
  path,
  value,
  setValue,
  home = "/root",
  fallbackValue = null,
}: {
  path: string;
  value: T | null;
  setValue: (value: T) => void;
  home?: string;
  fallbackValue: T | null;
}) {
  useEffect(() => {
    if (value === null) return;
    writeFile(path, JSON.stringify(value), { home }).catch(() => {});
  }, [home, path, value]);

  useEffect(() => {
    readFile(path, { home })
      .then((file) => file.text())
      .then((contents) => {
        setValue(JSON.parse(contents));
      })
      .catch(() => {
        setValue(fallbackValue);
      });
  }, [home, path, setValue, fallbackValue]);
}
