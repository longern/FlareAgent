export const onRequest: PagesFunction = async function (context) {
  const { request } = context;
  const url = new URL(request.url);
  const delimiterIndex = url.pathname.indexOf("/", 1);
  const domain = url.pathname.slice(1, delimiterIndex);
  const path = url.pathname.slice(delimiterIndex);
  const targetUrl = `https://${domain}/${path}`;
  const targetRequest = new Request(targetUrl, request);
  return fetch(targetRequest);
};
