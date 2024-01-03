export type SchemeHandler = (
  url: string,
  options?: RequestInit
) => Promise<Response>;

const schemeHandlers: {
  [key: string]: SchemeHandler;
} = {};

if (typeof window !== "undefined") {
  const oldFetch = window.fetch;
  window.fetch = async (url: string, options?: RequestInit) => {
    const scheme = url.split(":")[0];
    if (schemeHandlers[scheme]) {
      return await schemeHandlers[scheme](url, options);
    }
    return await oldFetch(url, options);
  };
}

export function registerSchemeHandler(scheme: string, handler: SchemeHandler) {
  schemeHandlers[scheme] = handler;
}
