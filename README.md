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

To access chat messages and variables in python, use the following code:

```py
import flareagent
print(flareagent.messages)
flareagent.variables["foo"] = "bar"
```

Variables can be accessed in the system prompt with `{foo}`.
