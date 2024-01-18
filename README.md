# Flare Agent

Another ChatGPT front-end. Focus on tool calls and workflow management.

## Features

- [x] Chat with GPT-3.5 and GPT-4
- [x] Markdown support
- [x] LaTeX support
- [x] Code Highlighting
- [x] Local tools
  - [x] Current time
  - [x] Run python code (with pyodide)
  - [x] IndexedDB File System
- [x] Remote tools
  - [x] DuckDuckGo search (Need Cloudflare Workers)
  - [x] Crawl a web page (Need Cloudflare Workers)
  - [x] Dalle-3 image generation
- [x] Proxy OpenAI requests
- [x] Workflow management

## Usage

### Basic

1. Visit website in repository description.
2. Set your OpenAI API key in the settings page.

### Python reference

Chat messages can be accessed by `MESSAGES` environment variable.
Any modification to `os.environ` will be preserved between messages.

```py
import os
print(os.environ["MESSAGES"])
os.environ["foo"] = "bar"
```

Environment variables can be accessed in the system prompt with `{foo}`.
