export const onRequest: PagesFunction = async function (context) {
  const { request, params } = context;
  const [domain, ...rest] = params.url as string[];
  const pathname = rest.map((s) => `/${s}`).join("");
  const url = new URL(request.url);
  const hash = url.hash;
  const search = url.search;
  const targetUrl = `https://${domain}${pathname}${search}${hash}`;
  const targetRequest = new Request(targetUrl, request);
  return fetch(targetRequest);
};
