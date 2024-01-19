const aiohttp = `
import io
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

        @property
        def ok(self):
            return self.response.ok

        @property
        def status(self):
            return self.response.status

        @property
        def content(self):
            return AiohttpModule.StreamReader(self.response.bytes())

        async def read(self):
            return await self.response.bytes()

        async def text(self):
            return await self.response.text()

        async def json(self):
            return await self.response.json()

    class StreamReader:
        def __init__(self, bytesCoro):
            self.bytesCoro = bytesCoro
            self.bytesIO = None

        async def read(self, n=-1):
            if self.bytes is None:
                self.bytesIO = io.BytesIO(await self.bytesCoro)
            return self.bytesIO.read(n)

sys.modules["aiohttp"] = AiohttpModule()
`;

export default aiohttp;
