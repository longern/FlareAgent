import { useEffect } from "react";

export const DIRECTORY = navigator.storage?.getDirectory
  ? navigator.storage.getDirectory()
  : Promise.resolve<undefined>(undefined);

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
    const directories = path
      .replace(new RegExp(`^${home.replace("/", "\\/")}/?`), "")
      .split("/");
    const filename = directories.pop();
    const directory = directories.reduce(
      (promise, dirName) =>
        promise.then((directory) =>
          directory.getDirectoryHandle(dirName, { create: true })
        ),
      DIRECTORY
    );
    directory
      .then(async (directory) => {
        const fileHandle = await directory.getFileHandle(filename, {
          create: true,
        });
        const writable = await fileHandle.createWritable();
        await writable.write(JSON.stringify(value));
        await writable.close();
      })
      .catch(() => {});
  }, [home, path, value]);

  useEffect(() => {
    const directories = path
      .replace(new RegExp(`^${home.replace("/", "\\/")}/?`), "")
      .split("/");
    const filename = directories.pop();
    const directory = directories.reduce(
      (promise, dirName) =>
        promise.then((directory) => directory.getDirectoryHandle(dirName)),
      DIRECTORY
    );
    directory
      .then(async (directory) => {
        const fileHandle = await directory.getFileHandle(filename);
        const file = await fileHandle.getFile();
        const contents = await file.text();
        setValue(JSON.parse(contents));
      })
      .catch(() => {
        setValue(fallbackValue);
      });
  }, [home, path, setValue, fallbackValue]);
}
