# M1 Observe And Diagnostics Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enrich `macos-gui-skill` with better observation context and environment diagnostics without adding OCR.

**Architecture:** Keep the existing `observe -> act -> observe` loop and extend the standalone CLI with window-scoped observation and machine-readable diagnostics. Implement the first milestone in the single script, backed by focused CLI tests that stub platform interactions and verify JSON output.

**Tech Stack:** Node.js 20+, ES modules, built-in `node:test`, `@nut-tree-fork/nut-js`

---

### Task 1: Add a CLI test harness

**Files:**
- Create: `tests/cli.test.mjs`
- Modify: `package.json`

**Step 1: Write the failing test**

Add a test file that spawns `node ./scripts/macos-gui-skill.mjs ...` with test-only environment hooks and asserts:
- `observe` returns `screenSize`, `captureRegion`, `coordinateSpace`, and `permissions`
- `doctor` returns permission and dependency status
- `list-windows` and `window-bounds` return structured window data

**Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL because the commands and fields do not exist yet.

**Step 3: Write minimal implementation hooks**

Add a `test` script to `package.json` using Node's built-in runner.

**Step 4: Run test to verify the harness works**

Run: `npm test`
Expected: Failing assertions against the current CLI behavior, not harness errors.

### Task 2: Implement observation metadata and diagnostics

**Files:**
- Modify: `scripts/macos-gui-skill.mjs`
- Test: `tests/cli.test.mjs`

**Step 1: Write the failing test**

Add precise assertions for:
- `observe --region 10,20,300,400`
- `doctor`
- `list-windows`
- `window-bounds --app-name Finder`

**Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL on unknown commands and missing response fields.

**Step 3: Write minimal implementation**

Add:
- `doctor`
- `list-windows`
- `window-bounds`
- richer `observe` output with screen size, region metadata, coordinate space, permissions summary
- optional `--region` parsing for `observe` and `screenshot`
- test-only adapters via environment variables so the CLI can be exercised deterministically

**Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS

### Task 3: Update skill docs

**Files:**
- Modify: `README.md`
- Modify: `SKILL.md`

**Step 1: Write the failing test**

No automated doc test; instead verify that docs mention the new commands and structured observation fields.

**Step 2: Write minimal implementation**

Document:
- `doctor`
- `list-windows`
- `window-bounds`
- `observe` region/window usage and richer output

**Step 3: Verify docs**

Run: `rg -n "doctor|list-windows|window-bounds|captureRegion|screenSize" README.md SKILL.md`
Expected: matches in both documents.

### Task 4: Final verification

**Files:**
- Verify: `scripts/macos-gui-skill.mjs`
- Verify: `tests/cli.test.mjs`
- Verify: `README.md`
- Verify: `SKILL.md`

**Step 1: Run automated checks**

Run:
- `npm test`
- `npm run check`

Expected: PASS

**Step 2: Sanity check help output**

Run: `node ./scripts/macos-gui-skill.mjs --help`
Expected: includes `doctor`, `list-windows`, and `window-bounds`.

**Step 3: Commit**

```bash
git add README.md SKILL.md package.json tests/cli.test.mjs scripts/macos-gui-skill.mjs docs/plans/2026-03-16-m1-observe-design.md
git commit -m "feat: add observe diagnostics and window inspection"
```
