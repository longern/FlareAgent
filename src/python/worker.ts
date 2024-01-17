import aiohttp from "./aiohttp";

importScripts("https://cdn.jsdelivr.net/pyodide/dev/full/pyodide.js");

async function initPyodide() {
  // eslint-disable-next-line no-restricted-globals
  const pyodide = await (self as any).loadPyodide();
  pyodide.registerJsModule("flareagent", flareAgentModule);

  const mountDir = "/root";
  pyodide.FS.mkdir(mountDir);
  pyodide.FS.mount(pyodide.FS.filesystems.IDBFS, { root: "." }, mountDir);
  pyodide.FS.chdir(mountDir);

  pyodide.runPython(aiohttp, { filename: "aiohttp.py" });

  return pyodide;
}

let pyodideReadyPromise = initPyodide();
let flareAgentModule = {};

// eslint-disable-next-line no-restricted-globals
self.onmessage = async (
  event: MessageEvent<{
    id: string;
    code: string;
    messages?: any;
    variables?: Record<string, any>;
    interruptBuffer?: Uint8Array;
  }>
) => {
  const pyodide = await pyodideReadyPromise;
  const { id, code, messages, variables, interruptBuffer } = event.data;

  if (messages) {
    flareAgentModule["messages"] = pyodide.toPy(messages);
  }
  if (variables) {
    flareAgentModule["variables"] = pyodide.toPy(variables);
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
    const variables = flareAgentModule["variables"]?.toJs();
    // eslint-disable-next-line no-restricted-globals
    self.postMessage({ result, id, variables });
  } catch (error) {
    // eslint-disable-next-line no-restricted-globals
    self.postMessage({ error: error.message, id });
  }
};
