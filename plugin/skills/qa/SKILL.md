---
name: qa
description: Test a web app end to end like a QA engineer with the Breakpoint MCP tools (sandboxed, recorded browser; oracles; bug reports; replay). Use when asked to QA, e2e test, smoke test or find bugs in an app's UI, to check a flow works in the browser, to reproduce a reported UI bug, or to verify a fix in the real app.
---

# QA with Breakpoint

You are the tester. Breakpoint's MCP tools (`start_session`, `read_page`, `click`, `report_bug`, `replay_finding`…) give you a sandboxed Chromium that is screen-recorded,
oracles that catch console errors, failed requests and server exceptions, and findings you can replay after a fix.
Nothing in Breakpoint calls a model: every judgement is yours.

## 1. Start

- Docker must be running. The first `start_session` on a machine builds the sandbox image (a few minutes).
- **App already running locally?** `start_session` with `repo_path` and `app_url` (e.g. `http://localhost:5173`).
  This attaches; it does not boot anything. Actions hit the developer's real dev data, so avoid destructive actions
  (delete, pay, send, invite) unless they asked for them.
- **Not running?** `start_session` with `repo_path` only. Breakpoint boots it from its compose file, Dockerfile or
  package.json, with seeded data, a mail catcher and a Stripe mock, and snapshots the databases.
- Logins: pass `accounts` (role, username, password), or the repo's `breakpoint.json` provides them. Never guess
  real credentials; ask the developer for a test login.
- Tell the developer the `liveView` URL from the result so they can watch.

## 2. Plan journeys

Read the repo first: routes, the data model, roles, and what changed recently (`git diff`, `git log`) when the
request is about a change. Then pick 3 to 6 journeys a real user would do, riskiest first: sign up and log in,
the core create/edit/delete flow, money, permissions between roles, and anything the diff touched. For each,
write down what a human would check along the way.

## 3. Run each journey

1. `begin_journey` with a concrete title, the role, the start path and the checks. It starts logged out.
2. Look before acting: `read_page` (or `find`) for refs, `screenshot` when layout matters.
3. Act with `click`, `form_input`, `type`, `key`, `navigate`. Refs go stale after the page changes: re-read.
4. Read what each action returns. A `Signals during this step` block means an oracle fired (console error,
   4xx/5xx, uncaught exception, server error). Every signal is worth a look; not every signal is a bug.
5. Check the outcome like a human: did the total update, did the item appear in the list, does the page still
   make sense after a reload, does back work, does the empty or error state read well.
6. Try the edges a careless user hits: empty and very long input, special characters, double submit, wrong
   password, a second tab, reloading mid-flow, going back after submit.
7. `end_journey` with passed or failed and one line on why.

Use `read_inbox` for verification emails on booted stacks, `logs` when you need the raw console, network or
server lines, and `reset_data` to return to the seeded state between destructive journeys.

## 4. Report bugs

Call `report_bug` the moment you are sure, while the page still shows it:

- A specific title ("Cart total ignores quantity", not "Cart bug"), honest severity, expected vs actual.
- `proof`: the signal signatures that show it. With proof, `replay_finding` can confirm a fix without you looking.
  Visual or logic bugs with no signal are still worth filing; their replay comes back as a screenshot to judge.
- One finding per root cause. Do not file the same bug twice from two journeys.

## 5. Fix and verify (when asked to fix)

1. `get_finding` for the handoff: repro steps, evidence, suspect files with snippets.
2. Reproduce from the steps, fix the root cause in code, and add a test that fails before the fix.
3. Wait for the dev server to reload, then `replay_finding`. "FIXED" means the proof no longer fires; "STILL
   FIRES" means it does not work yet. For findings without proof, judge the returned screen yourself.

## 6. Finish

Always call `stop_session`, even after an error: it finalises the video, cuts a clip and GIF per finding and
writes `report.md`. Then tell the developer, briefly: journeys run and their results, each finding with severity
and the suspect file, what you fixed and whether replay confirmed it, and the report path.
