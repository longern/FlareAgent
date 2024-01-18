import aiohttp from "./aiohttp";

importScripts("https://cdn.jsdelivr.net/pyodide/dev/full/pyodide.js");

async function initPyodide() {
  // eslint-disable-next-line no-restricted-globals
  const pyodide = await (self as any).loadPyodide();

  const mountDir = "/root";
  pyodide.FS.mkdir(mountDir);
  pyodide.FS.mount(pyodide.FS.filesystems.IDBFS, { root: "." }, mountDir);
  pyodide.FS.chdir(mountDir);

  pyodide.runPython(aiohttp, { filename: "aiohttp.py" });

  osEnviron = pyodide.runPython("import os\ndict(os.environ)").toJs();

  return pyodide;
}

let pyodideReadyPromise = initPyodide();
let osEnviron: Map<string, string> | undefined;

// eslint-disable-next-line no-restricted-globals
self.onmessage = async (
  event: MessageEvent<{
    id: string;
    code: string;
    env?: Map<string, string>;
    interruptBuffer?: Uint8Array;
  }>
) => {
  const pyodide = await pyodideReadyPromise;
  const { id, code, env, interruptBuffer } = event.data;

  if (env) {
    osEnviron?.forEach((_value, key) => env.delete(key));
    pyodide.globals.set("env", pyodide.toPy(env));
    pyodide.runPython(`import os; os.environ.update(env)`);
    pyodide.globals.delete("env");
  }

  try {
    await pyodide.loadPackagesFromImports(code);
    await new Promise((resolve) => pyodide.FS.syncfs(true, resolve));
    const stdoutBuffer: string[] = [];
    pyodide.setStdout({
      batched: (output: string) => stdoutBuffer.push(output + "\n"),
    });
    if (interruptBuffer) {
      pyodide.setInterruptBuffer(interruptBuffer);
    }
    const lastExpr = await pyodide.runPythonAsync(code);
    await new Promise((resolve) => pyodide.FS.syncfs(false, resolve));
    const result = stdoutBuffer.join("") + (lastExpr ?? "");

    const environProxy = pyodide.runPython("import os\ndict(os.environ)");
    const variables = environProxy.toJs() as Map<string, string>;
    osEnviron!.forEach((_value, key) => variables.delete(key));

    // eslint-disable-next-line no-restricted-globals
    self.postMessage({ result, id, variables });
  } catch (error) {
    // eslint-disable-next-line no-restricted-globals
    self.postMessage({ error: error.message, id });
  }
};
