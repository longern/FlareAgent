const aiohttp = `
import sys
from urllib.parse import urlparse
from pyodide.http import pyfetch

def proxyUrl(url):
    parsed = urlparse(url)
    return "/crawl/" + parsed.netloc + parsed.path

class AiohttpModule:
    class ClientSession:
        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            pass

        def get(self, url):
            return AiohttpModule.ClientResponse(pyfetch(proxyUrl(url)))

        def post(self, url, data):
            return AiohttpModule.ClientResponse(pyfetch(proxyUrl(url), {
                "method": "POST",
                "body": data
            }))

    class ClientResponse:
        def __init__(self, response):
            self.responseCoro = response
            self.response = None

        async def __aenter__(self):
            self.response = await self.responseCoro
            return self

        async def __aexit__(self, *args):
            pass

        async def text(self):
            return await self.response.text()

sys.modules["aiohttp"] = AiohttpModule()
`;

export default aiohttp;
