let pythonWorker: Worker | undefined;

function generateRandomHexString(numBytes: number) {
  return Array.from(crypto.getRandomValues(new Uint8Array(numBytes)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function signalToInterruptBuffer(signal: AbortSignal | undefined) {
  if (!signal || !window.crossOriginIsolated) return undefined;

  const interruptBuffer = new Uint8Array(new SharedArrayBuffer(1));
  signal.addEventListener("abort", () => {
    interruptBuffer[0] = 2;
  });
  return interruptBuffer;
}

export function runPython(
  code: string,
  options?: {
    env?: Map<string, string>;
    signal?: AbortSignal;
  }
): Promise<{
  result: string;
  variables: Map<string, string>;
}> {
  options = options ?? {};
  const { env, signal } = options;

  if (!pythonWorker) {
    pythonWorker = new Worker(new URL("./worker.ts", import.meta.url));
  }

  const interruptBuffer = signalToInterruptBuffer(signal);

  return new Promise((resolve, reject) => {
    const id = generateRandomHexString(32);
    function handleMessage(event: MessageEvent) {
      if (event.data.id === id) {
        const { result, error, variables } = event.data;
        pythonWorker!.removeEventListener("message", handleMessage);
        error ? reject(new Error(error)) : resolve({ result, variables });
      }
    }
    pythonWorker!.addEventListener("message", handleMessage);
    pythonWorker!.postMessage({
      id,
      code,
      interruptBuffer,
      env,
    });
  });
}

export function importFile(file: File) {
  if (!pythonWorker) {
    pythonWorker = new Worker(new URL("./worker.ts", import.meta.url));
  }

  return new Promise((resolve) => {
    function handleMessage(event: MessageEvent) {
      if (event.data.file.name === file.name) {
        pythonWorker!.removeEventListener("message", handleMessage);
        resolve(void 0);
      }
    }
    pythonWorker!.addEventListener("message", handleMessage);
    pythonWorker!.postMessage({ file });
  });
}
