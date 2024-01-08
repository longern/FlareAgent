function getIDBFS({ name, version }: { name: string; version: number }) {
  const dbPromise = new Promise<IDBDatabase>(async (resolve, reject) => {
    const databases = await window.indexedDB.databases();
    if (!databases.find((db) => db.name === name))
      return reject(new Error("Database not found"));
    const request = window.indexedDB.open(name, version);
    request.onsuccess = () => {
      resolve(request.result);
    };
  });

  async function readFile(path: string) {
    const db = await dbPromise;
    return new Promise<Int8Array>((resolve, reject) => {
      const transaction = db.transaction(["FILE_DATA"], "readonly");
      const objectStore = transaction.objectStore("FILE_DATA");
      const request: IDBRequest<{
        contents: Int8Array;
        mode: number;
        timestamp: Date;
      }> = objectStore.get(path);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result?.contents);
    });
  }

  async function writeFile(path: string, contents: Int8Array) {
    const db = await dbPromise;
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(["FILE_DATA"], "readwrite");
      const objectStore = transaction.objectStore("FILE_DATA");
      const request = objectStore.put(
        {
          contents,
          mode: 0o100666,
          timestamp: new Date(),
        },
        path
      );
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async function mkdir(path: string, mode: number = 0o775) {
    const db = await dbPromise;
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(["FILE_DATA"], "readwrite");
      const objectStore = transaction.objectStore("FILE_DATA");
      const request = objectStore.put(
        {
          mode: 0o40000 | (mode & 0o777),
          timestamp: new Date(),
        },
        path
      );
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  return {
    readFile,
    writeFile,
    mkdir,
  };
}

export const FS = getIDBFS({
  name: "/root",
  version: 21,
});
