import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { PNG } from 'pngjs';

const repoRoot = '/Users/baibairui/codexclaw/macos-gui-skill';
const cliPath = path.join(repoRoot, 'scripts/macos-gui-skill.mjs');

const testState = {
  permissions: {
    accessibility: true,
    screenRecording: true,
    automation: false,
  },
  frontmostApp: 'Finder',
  screenSize: {
    width: 1440,
    height: 900,
  },
  windows: [
    {
      appName: 'Finder',
      title: 'Desktop',
      bounds: { x: 0, y: 25, width: 1440, height: 875 },
      active: true,
    },
    {
      appName: 'Safari',
      title: 'Docs',
      bounds: { x: 120, y: 80, width: 1180, height: 760 },
      active: false,
    },
  ],
};

function runCli(args, state = testState) {
  const result = spawnSync('node', [cliPath, ...args], {
    cwd: repoRoot,
    env: {
      ...process.env,
      MACOS_GUI_SKILL_TEST_STATE: JSON.stringify(state),
    },
    encoding: 'utf8',
  });

  return {
    ...result,
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim(),
  };
}

function parseJsonOutput(result) {
  assert.equal(result.status, 0, `expected success, got stderr: ${result.stderr}`);
  return JSON.parse(result.stdout);
}

function writePng(filePath, width, height, pixelAt) {
  const png = new PNG({ width, height });
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = (width * y + x) << 2;
      const [r, g, b, a = 255] = pixelAt(x, y);
      png.data[idx] = r;
      png.data[idx + 1] = g;
      png.data[idx + 2] = b;
      png.data[idx + 3] = a;
    }
  }
  fs.writeFileSync(filePath, PNG.sync.write(png));
}

test('observe returns structured metadata for a region capture', () => {
  const result = runCli(['observe', '--label', 'inbox', '--region', '10,20,300,400']);
  const output = parseJsonOutput(result);

  assert.equal(output.ok, true);
  assert.equal(output.data.frontmostApp, 'Finder');
  assert.equal(output.data.label, 'inbox');
  assert.deepEqual(output.data.screenSize, { width: 1440, height: 900 });
  assert.deepEqual(output.data.captureRegion, { x: 10, y: 20, width: 300, height: 400, source: 'region' });
  assert.deepEqual(output.data.coordinateSpace, { origin: 'top-left', units: 'points', normalizedScreenshot: true });
  assert.deepEqual(output.data.permissions, {
    accessibility: true,
    screenRecording: true,
    automation: false,
  });
  assert.match(output.data.path, /\.codex\/artifacts\/desktop\/inbox-finder-\d+\.png$/);
});

test('doctor reports permissions and dependency resolution', () => {
  const result = runCli(['doctor']);
  const output = parseJsonOutput(result);

  assert.equal(output.ok, true);
  assert.deepEqual(output.data.permissions, {
    accessibility: true,
    screenRecording: true,
    automation: false,
  });
  assert.equal(output.data.actReady, true);
  assert.deepEqual(output.data.blockers, []);
  assert.equal(output.data.dependencies.nutJs.resolved, true);
  assert.equal(output.data.environment.platform, 'darwin');
});

test('doctor reports act blockers instead of requiring fallback guesswork', () => {
  const blockedState = {
    ...testState,
    permissions: {
      accessibility: false,
      screenRecording: true,
      automation: false,
    },
    dependencyOverrides: {
      nutJs: {
        resolved: false,
        message: 'failed to resolve @nut-tree-fork/nut-js from the current workspace or skill directory',
      },
    },
  };
  const output = parseJsonOutput(runCli(['doctor'], blockedState));

  assert.equal(output.data.actReady, false);
  assert.deepEqual(output.data.blockers, [
    'accessibility_permission_missing',
    'nutjs_unavailable',
  ]);
  assert.equal(output.data.recommendedCommand, 'doctor');
  assert.equal(output.data.dependencies.nutJs.resolved, false);
});

test('list-windows and window-bounds return structured window data', () => {
  const listed = parseJsonOutput(runCli(['list-windows']));
  assert.equal(listed.data.windows.length, 2);
  assert.deepEqual(listed.data.windows[0], testState.windows[0]);

  const bounds = parseJsonOutput(runCli(['window-bounds', '--app-name', 'Safari']));
  assert.deepEqual(bounds.data.window, testState.windows[1]);
  assert.deepEqual(bounds.data.bounds, testState.windows[1].bounds);
});

test('locate-image and locate-image-center find a PNG template inside a PNG capture', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'macos-gui-skill-'));
  const sourcePath = path.join(tempDir, 'source.png');
  const templatePath = path.join(tempDir, 'template.png');

  writePng(sourcePath, 6, 5, (x, y) => {
    if (x >= 2 && x <= 3 && y >= 1 && y <= 2) {
      return [240, 80, 40, 255];
    }
    return [20 + x, 30 + y, 100, 255];
  });
  writePng(templatePath, 2, 2, () => [240, 80, 40, 255]);

  const located = parseJsonOutput(runCli(['locate-image', '--source-image', sourcePath, '--image', templatePath]));
  assert.equal(located.data.found, true);
  assert.equal(located.data.confidence, 1);
  assert.deepEqual(located.data.boundingBox, {
    left: 2,
    top: 1,
    width: 2,
    height: 2,
    center_x: 3,
    center_y: 2,
  });

  const centered = parseJsonOutput(runCli(['locate-image-center', '--source-image', sourcePath, '--image', templatePath]));
  assert.equal(centered.data.found, true);
  assert.deepEqual(centered.data.center, { x: 3, y: 2 });
});

test('act rejects invalid bundle steps before execution', () => {
  const badCoordinate = runCli(['act', '--steps', '[{"type":"click","x":-1,"y":25}]']);
  assert.equal(badCoordinate.status, 1);
  assert.match(badCoordinate.stderr, /must be within the current screen bounds/i);

  const badText = runCli(['act', '--steps', '[{"type":"type-text","text":"   "}]']);
  assert.equal(badText.status, 1);
  assert.match(badText.stderr, /missing required string argument/i);

  const badHotkey = runCli(['act', '--steps', '[{"type":"hotkey","keys":[]}]']);
  assert.equal(badHotkey.status, 1);
  assert.match(badHotkey.stderr, /requires at least one key/i);
});
