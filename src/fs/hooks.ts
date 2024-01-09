import { useEffect } from "react";
import { FS } from "./index";

export function useSyncFS<T = any>({
  path,
  value,
  setValue,
  fallbackValue = null,
}: {
  path: string;
  value: T | null;
  setValue: (value: T) => void;
  fallbackValue: T | null;
}) {
  useEffect(() => {
    if (value === null) return;
    const promise = Promise.resolve();
    const directories = path.split("/");
    directories.pop();
    directories.shift();
    const root = "/" + directories.shift();
    directories
      .reduce<[Promise<void>, string]>(
        ([promise, path], directory) => {
          const newPath = `${path}/${directory}`;
          const newPromise = promise.then(() => FS.mkdir(newPath));
          return [newPromise, newPath] as const;
        },
        [promise, root]
      )[0]
      .then(() =>
        FS.writeFile(
          path,
          new Int8Array(new TextEncoder().encode(JSON.stringify(value)))
        )
      )
      .catch(() => {});
  }, [path, value]);

  useEffect(() => {
    FS.readFile(path)
      .then((contents) => {
        setValue(
          contents
            ? JSON.parse(new TextDecoder().decode(contents))
            : fallbackValue
        );
      })
      .catch(() => setValue(fallbackValue));
  }, [path, setValue, fallbackValue]);
}
