import { registerSchemeHandler } from "../scheme";
import { TOOL_SCHEME } from "./index";
import app from "./route";

registerSchemeHandler(
  TOOL_SCHEME,
  async (url: string, options?: RequestInit) => {
    const urlObj = new URL(url);
    const response = await app.fetch(
      new Request(urlObj.pathname.replace("//", "/"), options)
    );
    return response;
  }
);
