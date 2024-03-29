"use client";

export type SchemeHandler = (
  url: RequestInfo | URL,
  options?: RequestInit
) => Promise<Response>;

const schemeHandlers: {
  [key: string]: SchemeHandler;
} = {};

function hijackFetch() {
  const oldFetch = window.fetch;
  window.fetch = async (url: RequestInfo | URL, options?: RequestInit) => {
    const scheme = typeof url === "string" ? url.split(":")[0] : "";
    if (schemeHandlers[scheme]) {
      return await schemeHandlers[scheme](url, options);
    }
    return await oldFetch(url, options);
  };
}

export function registerSchemeHandler(scheme: string, handler: SchemeHandler) {
  schemeHandlers[scheme] = handler;
}

hijackFetch();
