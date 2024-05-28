"use client";

export type HostnameHandler = (
  url: RequestInfo | URL,
  options?: RequestInit
) => Response | Promise<Response>;

const hostnameHandlers: {
  [key: string]: HostnameHandler;
} = {};

function hijackFetch() {
  const oldFetch = window.fetch;
  window.fetch = async (url: RequestInfo | URL, options?: RequestInit) => {
    const normalizedUrl =
      url instanceof URL
        ? url
        : url instanceof Request
        ? new URL(url.url)
        : new URL(url, window.location.href);
    const hostname = normalizedUrl.hostname;
    if (hostnameHandlers[hostname]) {
      return await hostnameHandlers[hostname](url, options);
    }
    return await oldFetch(url, options);
  };
}

export function registerHostnameHandler(
  hostname: string,
  handler: HostnameHandler
) {
  hostnameHandlers[hostname] = handler;
}

hijackFetch();
