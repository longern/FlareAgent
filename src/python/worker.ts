import aiohttp from "./aiohttp";
import matplotlib from "./matplotlib";

importScripts("https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js");

const HOME = "/root";

async function initPyodide() {
  // eslint-disable-next-line no-restricted-globals
  const pyodide = await (self as any).loadPyodide({
    packages: ["micropip"],
  });

  const dirHandle = await navigator.storage.getDirectory();
  pyodide.mountNativeFS(HOME, dirHandle);
  pyodide.FS.chdir(HOME);

  pyodide.runPython(aiohttp, { filename: "aiohttp.py" });

  osEnviron = pyodide.runPython("import os\ndict(os.environ)").toJs();

  return pyodide;
}

let pyodideReadyPromise = initPyodide();
let osEnviron: Map<string, string> | undefined;
let matplotlibLoaded = false;

async function handleCodeMessage({
  id,
  code,
  env,
  interruptBuffer,
}: {
  id: string;
  code: string;
  env?: Map<string, string>;
  interruptBuffer?: Uint8Array;
}) {
  const pyodide = await pyodideReadyPromise;

  if (env) {
    osEnviron!.forEach((_value, key) => env.delete(key));
    pyodide.runPython(`import os; os.environ.update(env)`, {
      globals: pyodide.toPy({ env }),
    });
  }

  try {
    await pyodide.runPythonAsync(
      [
        "import micropip",
        "import os",
        "import sys",
        "from pyodide.code import find_imports",
        "imports = find_imports(code)",
        "os.environ['MPLBACKEND'] = 'AGG'",
        "await micropip.install([name for name in imports if name not in sys.modules])",
      ].join("\n"),
      { globals: pyodide.toPy({ code }) }
    );

    if (
      Object.keys(pyodide.loadedPackages).includes("matplotlib") &&
      !matplotlibLoaded
    ) {
      pyodide.runPython(matplotlib, { filename: "matplotlib.py" });
      matplotlibLoaded = true;
    }

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

    return { result, id, variables };
  } catch (error) {
    return { error: error.message, id };
  }
}

// eslint-disable-next-line no-restricted-globals
self.onmessage = function (
  event: MessageEvent<{
    id: string;
    code: string;
    env?: Map<string, string>;
    interruptBuffer?: Uint8Array;
  }>
) {
  let result: Promise<any>;
  if ("code" in event.data) {
    result = handleCodeMessage(event.data);
  }
  result.then((data: any) => {
    // eslint-disable-next-line no-restricted-globals
    self.postMessage(data);
  });
};
