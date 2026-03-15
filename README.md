# macOS GUI Skill

`macos-gui-skill` is a standalone macOS desktop automation skill for Codex-compatible agents.

The repo root is the skill root. It ships:

- `SKILL.md`
- `agents/openai.yaml`
- `scripts/macos-gui-skill.mjs`

## What It Does

- screenshot-guided desktop automation
- `observe -> act -> observe` workflow
- structured observation metadata for screen size, capture region, and permission status
- desktop diagnostics and window inspection commands
- PNG template matching with `locate-image` and `locate-image-center`
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
node ./scripts/macos-gui-skill.mjs observe --active-window true
```

```bash
node ./scripts/macos-gui-skill.mjs act --steps '[{"type":"activate-app","appName":"Finder"},{"type":"hotkey","keys":["Meta","n"]}]'
```

```bash
node ./scripts/macos-gui-skill.mjs click --x 640 --y 420 --button left
```

```bash
node ./scripts/macos-gui-skill.mjs doctor
```

```bash
node ./scripts/macos-gui-skill.mjs list-windows
node ./scripts/macos-gui-skill.mjs window-bounds --app-name Finder
```

```bash
node ./scripts/macos-gui-skill.mjs locate-image --image ./button-template.png --active-window true
node ./scripts/macos-gui-skill.mjs locate-image-center --image ./button-template.png --source-image ./capture.png
```

## Observation Output

`observe` returns JSON with the screenshot path plus context the model can consume directly:

- `path`
- `local_image_path`
- `frontmostApp`
- `screenSize`
- `captureRegion`
- `coordinateSpace`
- `permissions`

Use `--region x,y,width,height` to capture a specific area or `--active-window true` to target the active window bounds.

## Template Matching

`locate-image` and `locate-image-center` search for a PNG template inside:

- a provided PNG capture via `--source-image`
- or a fresh screenshot taken from the current desktop context

Useful flags:

- `--image <template.png>`: required PNG template
- `--source-image <capture.png>`: search inside an existing PNG instead of taking a new screenshot
- `--confidence <0-1>`: default `0.98`
- `--active-window true`
- `--region x,y,width,height`

This is template matching only. It does not perform OCR.

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

Test:

```bash
npm test
```

This repository intentionally keeps the skill small. The main implementation lives in [`scripts/macos-gui-skill.mjs`](./scripts/macos-gui-skill.mjs).
