async function extract_vqd(keyword: string) {
  const params = new URLSearchParams({ q: keyword });
  const response = await fetch(`https://duckduckgo.com/?${params}`);
  const body = await response.text();
  const match = body.match(/vqd=(?<vqd>[^'"&]+)/);
  if (!match) throw new Error(`Could not extract vqd from ${keyword}`);
  const { vqd } = match.groups!;
  return vqd;
}

async function search(keyword: string) {
  const vqd = await extract_vqd(keyword);
  const params = new URLSearchParams({ q: keyword, vqd });
  const response = await fetch(`https://links.duckduckgo.com/d.js?${params}`, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (X11; Linux x86_64; rv:60.0) Gecko/20100101 Firefox/81.0",
    },
  });
  const body = await response.text();
  try {
    const start = body.indexOf("DDG.pageLayout.load('d',") + 24;
    const end = body.indexOf(");DDG.duckbar.load(", start);
    const rows: { t: string; u: string; a: string }[] = JSON.parse(
      body.slice(start, end)
    );
    return {
      results: rows
        .map((row: any) => ({
          title: row.t,
          url: row.u,
          abstract: row.a,
        }))
        .filter((row: any) => row.url)
        .slice(0, 5),
    };
  } catch (e) {
    return { result: body };
  }
}

export const onRequestPost: PagesFunction = async function (context) {
  const { request } = context;
  const body: { keyword: string } = await request.json();
  const searchResult = await search(body.keyword);
  return Response.json(searchResult);
};
