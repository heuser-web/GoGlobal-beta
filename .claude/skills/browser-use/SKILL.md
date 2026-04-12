---
name: browser-use
description: >
  Run a real Chromium browser agent to interact with websites that can't be
  handled by a plain HTTP fetch. Use only when the task requires JavaScript
  execution, login state, clicking through UI, or scraping a site that blocks
  simple requests. Activate on: "browse", "scrape a site", "fill this form",
  "log into", "click through", "extract from a rendered page", or when an
  earlier web_fetch attempt failed because the page needed JS. Do NOT activate
  for: checking an npm version, hitting a JSON API, reading public docs, or
  any task a curl command could handle.
---

# browser-use — Live Browser Automation

This skill runs the `browser-use` Python library, which drives a real
Chromium instance via Playwright. It is expensive (10–60s per task, real
tokens, real compute) and should be the last resort, not the first.

## When to use this — and when not to

**Use browser-use when the task genuinely needs a browser:**

- The page renders content client-side with JavaScript and `web_fetch`
  returns an empty shell
- The task requires logging in, clicking, scrolling, or filling a form
- The site blocks non-browser user agents and returns 403 to `curl`
- You need to see what a user would see, rendered, to verify a layout or
  behavior

**Do not use browser-use for any of these — use something cheaper:**

| Task | Use instead |
|---|---|
| Check latest npm version | `curl https://registry.npmjs.org/<pkg>/latest` |
| Hit a JSON API endpoint | `curl` or `web_fetch` |
| Read public documentation | `web_fetch` — faster, cheaper, no browser |
| Check if a URL is live | `curl -I` for the status code |
| Google something | `web_search` — that's what it's for |

If you find yourself reaching for browser-use on a task from the right
column, stop. The answer is one of the tools on the right.

## Decision procedure

Before running browser-use, answer three questions:

1. **Can `web_fetch` get this?** Try it first if you're not sure. If it
   returns usable HTML, you're done — don't start a browser.
2. **Can `curl` get this?** For JSON APIs, status checks, and raw files,
   curl is two seconds and zero tokens. Use it.
3. **Does the task need interaction?** Clicking, typing, scrolling, waiting
   for JS to render. If yes, browser-use is the right tool. If no, it
   isn't.

Only if all three point to browser-use do you run it.

## Minimal template

One template. Edit the task string and the model. Everything else stays.

```python
import asyncio
from dotenv import load_dotenv
from browser_use import Agent
from langchain_openai import ChatOpenAI

load_dotenv()

async def run(task: str, model: str = "gpt-4o-mini") -> str:
    agent = Agent(task=task, llm=ChatOpenAI(model=model), max_failures=3)
    result = await agent.run()
    if result.has_errors():
        return f"ERROR: {result.errors()}"
    return result.final_result() or "NO_RESULT"

if __name__ == "__main__":
    print(asyncio.run(run("<your task here>")))
```

Save as `browse.py` in the project root. Run with `python browse.py` on
Windows or `python3 browse.py` on Mac.

## Model selection

Two choices. Pick based on task shape, not vibes:

- **`gpt-4o-mini`** — default. Use for any task that's "go to URL, find X,
  return it." Single-page lookups, reading a value off a rendered page,
  confirming a button exists. ~10x cheaper than 4o.
- **`gpt-4o`** — use only when the task requires reasoning across multiple
  pages, handling unexpected modals or redirects, or interpreting
  ambiguous content. If the task description contains "figure out,"
  "decide," or "depending on what you find," use 4o.

If a task fails on mini, retry on 4o before assuming the task is
impossible. Don't assume mini failed for capability reasons — it often
fails from impatience on slow-loading pages.

## Writing good task strings

The task string is the whole API. A bad task string is the #1 cause of
browser-use failures.

**Bad:** `"check framer-motion on npm"`
**Good:** `"Go to https://www.npmjs.com/package/framer-motion. Find the version number displayed in the right sidebar under 'Version'. Return only the version number, nothing else."`

Rules for task strings:

- **Start with a full URL.** Don't say "find the npm page for X" — give
  the URL. The agent is not a search engine.
- **Name the element.** "The version number in the right sidebar" beats
  "the version somewhere on the page."
- **Say what to return.** "Return only X" prevents the agent from
  narrating its browsing.
- **One task per run.** If you need three things, run three tasks in
  parallel — don't chain them in one prompt.

## Environment

- Python 3.13
- `browser-use` and `playwright` installed via pip
- Chromium installed via `playwright install chromium` — let Playwright
  manage the path, never hardcode it
- Keys in `.env`: `OPENAI_API_KEY` required; `ANTHROPIC_API_KEY` and
  `GOOGLE_API_KEY` optional for alternate backends
- Works on Mac (zsh) and Windows (PowerShell). The template above is
  shell-agnostic — only the `python` vs `python3` command differs

If Chromium isn't installed, `playwright install chromium` fixes it. Do
not troubleshoot paths. Do not hardcode cache directories.

## Failure modes

The three failures you will actually hit:

1. **Timeout on a slow page.** The agent gives up before the page
   finishes rendering. Fix: add `"Wait for the page to fully load before
   looking for X"` to the task string. If that doesn't work, the page
   probably has a loading spinner you need to name explicitly.

2. **403 / bot detection.** Some sites block headless Chromium regardless.
   If you see 403s or Cloudflare challenges, browser-use running locally
   won't fix it — you need Browser Use Cloud (`BROWSER_USE_API_KEY` in
   `.env`) or a different data source entirely. Don't waste time
   retrying locally.

3. **Agent returns a narration instead of the value.** "I went to the
   page and I can see the version is 11.2.10." Fix: the task string
   didn't say "return only X." Rewrite it and retry.

Record new failure modes in `references/troubleshooting.md` as you hit
them. Do not pre-fill that file with speculation.

## What this skill does not do

- It does not decide *whether* to browse. The decision procedure above
  does that, and the answer is often "don't."
- It does not manage a pool of agents, persistent sessions, or login
  state. If you need those, the task has grown past what this skill
  covers — stop and design the larger thing deliberately.
- It does not run inside Claude Code's own tool loop. browser-use is a
  separate Python process that Claude invokes via bash. It has its own
  LLM and its own context. Don't confuse the two.