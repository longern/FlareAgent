import { registerHostnameHandler } from "../fetch-mock";
import app from "./route";

export const TOOL_HOSTNAME = "localhost-tools";

registerHostnameHandler(
  TOOL_HOSTNAME,
  (url: URL | RequestInfo, options?: RequestInit) => {
    return app.fetch(new Request(url, options));
  }
);
