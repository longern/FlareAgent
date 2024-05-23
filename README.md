# Flare Agent

Another ChatGPT front-end. Focus on tool calls and workflow management.

## Features

- [x] Chat with GPT-3.5 and GPT-4
- [x] Image input (take photo or upload)
- [x] Markdown support
- [x] LaTeX support
- [x] Code highlighting
- [x] Unlimited local chat history storage (OPFS)
- [x] Local tools
  - [x] Run python code (with pyodide and OPFS)
- [x] Remote tools
  - [x] DuckDuckGo search (need Cloudflare Workers)
  - [x] Browser (need Cloudflare Workers)
  - [x] Dalle-3 image generation
- [x] Proxy OpenAI requests
- [x] Memory management
- [x] Workflow management

## Usage

### Basic

1. Visit website in repository description.
2. Set your OpenAI API key in the settings page.

### Python reference

Chat messages can be accessed by `MESSAGES` environment variable.
Any modification to `os.environ` will be preserved between messages.

An example of extracting the last message content:

```py
import os
import json
messages = json.loads(os.environ["MESSAGES"])
os.environ["CONTENT"] = messages[-1].content
```

Environment variables can be accessed in the system prompt (e.g. `{CONTENT}`).
