import fs from 'fs';
import glob from 'glob';
import makeDir from 'make-dir';
import path from 'path';
import { parseAndAnalyze, AnalyzeOptions } from './util';

// Assign a segment set to this variable to limit the test to only this segment
// This is super helpful if you need to debug why a specific fixture isn't producing the correct output
// eg. ['type-declaration', 'signatures', 'method-generic'] will only test /type-declaration/signatures/method-generic.ts
// prettier-ignore
const ONLY = [].join(path.sep);

const FIXTURES_DIR = path.resolve(__dirname, 'fixtures');

const fixtures = glob
  .sync(`${FIXTURES_DIR}/**/*.{js,ts,jsx,tsx}`, {
    ignore: ['fixtures.test.ts'],
  })
  .map(absolute => {
    const relative = path.relative(FIXTURES_DIR, absolute);
    const { name, dir, ext } = path.parse(relative);
    const segments = dir.split(path.sep);
    const snapshotPath = path.join(FIXTURES_DIR, dir);
    return {
      absolute,
      name,
      segments,
      snapshotPath,
      snapshotFile: path.join(snapshotPath, `${name}${ext}.shot`),
    };
  });

const FOUR_SLASH = /^\/\/\/\/[ ]+@(\w+) = (.+)$/;
const ALLOWED_OPTIONS: Set<string> = new Set<keyof AnalyzeOptions>([
  'ecmaVersion',
  'globalReturn',
  'impliedStrict',
  'sourceType',
]);

function nestDescribe(
  fixture: typeof fixtures[number],
  segments = fixture.segments,
): void {
  if (segments.length > 0) {
    describe(segments[0], () => {
      nestDescribe(fixture, segments.slice(1));
    });
  } else {
    const test = (): void => {
      const contents = fs.readFileSync(fixture.absolute, 'utf8');

      const lines = contents.split('\n');
      const options: Record<string, unknown> = {};
      for (const line of lines) {
        if (!line.startsWith('////')) {
          continue;
        }

        const match = FOUR_SLASH.exec(line);
        if (!match) {
          continue;
        }
        const [, key, value] = match;
        if (!ALLOWED_OPTIONS.has(key)) {
          throw new Error(`Unknown option ${key}`);
        }

        if (value === 'true') {
          options[key] = true;
        } else if (value === 'false') {
          options[key] = false;
        } else {
          options[key] = value;
        }
      }

      try {
        makeDir.sync(fixture.snapshotPath);
      } catch (e) {
        if ('code' in e && e.code === 'EEXIST') {
          // already exists - ignored
        } else {
          throw e;
        }
      }

      try {
        const { scopeManager } = parseAndAnalyze(contents, options);
        expect(scopeManager).toMatchSpecificSnapshot(fixture.snapshotFile);
      } catch (e) {
        expect(e).toMatchSpecificSnapshot(fixture.snapshotFile);
      }
    };

    if ([...fixture.segments, fixture.name].join(path.sep) === ONLY) {
      it.only(fixture.name, test);
    } else {
      it(fixture.name, test);
    }
  }
}

fixtures.forEach(f => nestDescribe(f));
