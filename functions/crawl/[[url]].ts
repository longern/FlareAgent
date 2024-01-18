export const onRequest: PagesFunction = async function (context) {
  const { request, params } = context;
  const [domain, ...rest] = params.url as string[];
  const pathname = rest.map((s) => `/${s}`).join("");
  const targetUrl = `https://${domain}${pathname}`;
  const targetRequest = new Request(targetUrl, request);
  return fetch(targetRequest);
};
