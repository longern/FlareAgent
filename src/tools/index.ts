import { registerSchemeHandler } from "../scheme";
import app from "./route";

const TOOL_SCHEME = "tool";

registerSchemeHandler(
  TOOL_SCHEME,
  async (url: string, options?: RequestInit) => {
    const response = await app.fetch(
      new Request(url.replace(`${TOOL_SCHEME}://`, "/"), options)
    );
    return response;
  }
);
