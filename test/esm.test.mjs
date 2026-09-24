// Packaging: the published dist must be importable by Node's ESM resolver.
// The package declares "type": "module", so every relative specifier needs an
// explicit extension. Bundlers paper over a missing one, so a UI consumer will
// never catch this — only a plain-Node import will, which is what this does.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const dist = join(dirname(fileURLToPath(import.meta.url)), "..", "dist");

describe("published ESM", () => {
  test("the root entry point imports under plain Node", async () => {
    const m = await import("../dist/index.js");
    assert.ok(m.Dmart, "Dmart must be exported from the root entry");
    assert.ok(m.DmartScope, "DmartScope must be exported from the root entry");
  });

  // Both are declared in package.json "exports"; a missing extension inside
  // either file breaks them independently of the root entry.
  test("the dmart.model subpath export imports", async () => {
    const m = await import("../dist/dmart.model.js");
    assert.ok(m.DmartScope);
  });

  test("the dmart.service subpath export imports", async () => {
    const m = await import("../dist/dmart.service.js");
    assert.ok(m.Dmart);
  });

  // The regression guard proper: assert on the emitted specifiers rather than
  // only on "does it happen to load today". Covers .d.ts too, since a bare
  // specifier there breaks consumers' type resolution under node16/nodenext.
  test("no emitted file uses an extensionless relative import", async () => {
    const files = (await readdir(dist)).filter(f => f.endsWith(".js") || f.endsWith(".d.ts"));
    assert.ok(files.length > 0, "dist must be built before running tests");

    const offenders = [];
    for (const file of files) {
      const src = await readFile(join(dist, file), "utf8");
      // any  from "./x"  /  from './x'  that does not end in a .js extension
      for (const m of src.matchAll(/from\s+["'](\.[^"']*)["']/g)) {
        if (!m[1].endsWith(".js")) offenders.push(`${file}: ${m[1]}`);
      }
    }
    assert.deepEqual(offenders, [],
      `extensionless relative imports break Node ESM consumers:\n  ${offenders.join("\n  ")}`);
  });
});
