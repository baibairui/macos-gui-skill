# macOS GUI Skill

`macos-gui-skill` is a standalone macOS desktop automation skill for Codex-compatible agents.

The repo root is the skill root. It ships:

- `SKILL.md`
- `agents/openai.yaml`
- `scripts/macos-gui-skill.mjs`

## What It Does

- screenshot-guided desktop automation
- `observe -> act -> observe` workflow
- frontmost-app recovery between invocations
- permission prompting for `Accessibility`, `Screen Recording`, and `Automation`
- mouse, keyboard, drag, screenshot, app activation, and AppleScript fallback

## Requirements

- macOS
- Node.js 20+
- `npm install`

## Install

Clone this repository directly into one of these paths:

- `~/.codex/skills/macos-gui-skill`
- `~/.agents/skills/macos-gui-skill`

Then install dependencies in the cloned directory:

```bash
npm install
```

If you keep the repo outside your skill directory, symlink it into the agent skill path instead of copying files. The script expects its own `node_modules` to remain available.

## Use

Examples:

```bash
node ./scripts/macos-gui-skill.mjs observe --label inbox --show-cursor true
```

```bash
node ./scripts/macos-gui-skill.mjs act --steps '[{"type":"activate-app","appName":"Finder"},{"type":"hotkey","keys":["Meta","n"]}]'
```

```bash
node ./scripts/macos-gui-skill.mjs click --x 640 --y 420 --button left
```

## Permissions

The script will prompt for or remind about:

- `Accessibility`
- `Screen Recording`
- `Automation`

Without those permissions, some GUI actions will fail or screenshots will only show the desktop background.

## Development

Smoke check:

```bash
npm run check
```

This repository intentionally keeps the skill small. The main implementation lives in [`scripts/macos-gui-skill.mjs`](./scripts/macos-gui-skill.mjs).
