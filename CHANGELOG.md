## 5.7.0

- **Auto-detect the API scope from the token.** `query`, `retrieveEntry`,
  `getAttachmentUrl` and `getPayload` no longer default to
  `DmartScope.managed`; omitting `scope` now selects `managed` when a token is
  set and `public` when one is not. An explicitly passed `scope` is still
  honoured, so this is source-compatible.

  The old default could only fail for an anonymous client: `managed/*` requires
  a bearer token and answers 401 without one. The visible symptom was public
  pages rendering their metadata correctly — the entry, its fields, even the
  list of attachments — while every image and audio file came back 401, because
  `getAttachmentUrl` built a `managed/payload/...` URL for a caller that had no
  token. Callers that already pass `DmartScope.public` explicitly (as the
  catalog UI does for `query` and `retrieveEntry`) are unaffected.

  Writes are deliberately excluded: `uploadWithPayload` keeps its `managed`
  default, because auto-detecting it would turn an anonymous upload from a
  guaranteed 401 into a real write attempt against the public endpoint.

- **`logout()` now clears the stored bearer token**, and a new
  `Dmart.clearToken()` exposes the same for callers that drop a session without
  hitting the endpoint. Previously the `Authorization` header survived logout,
  so `getToken()` kept reporting a session that no longer existed — harmless
  before, but it would have pinned scope auto-detection to `managed` and 401'd
  every read after a logout.

- **Fix the published ESM: `dist` no longer emits extensionless relative
  imports.** The package declares `"type": "module"`, so Node's ESM resolver
  requires explicit file extensions — but `tsconfig`'s
  `"moduleResolution": "bundler"` permits extensionless specifiers and tsc
  emits them verbatim, so `dist/index.js` contained
  `export * from "./dmart.model"` and `import('@edraj/tsdmart')` failed under
  plain Node with `ERR_MODULE_NOT_FOUND`.

  Bundlers (Vite, webpack, rollup) resolve extensionless imports themselves,
  which is why every UI consumer worked and the bug stayed invisible — it only
  bit direct Node consumers: scripts, SSR, tests, anything importing the
  library outside a bundler.

  Source specifiers now carry `.js` (TypeScript maps `./dmart.model.js` onto
  `dmart.model.ts`), and `module`/`moduleResolution` move to `nodenext` so tsc
  rejects a missing extension at compile time rather than shipping a dist that
  only works inside a bundler.

- **Add a test suite.** `npm test` now builds and runs 16 tests against the
  built `dist` via Node's built-in runner — no new dependencies. Testing the
  compiled output rather than the source is deliberate: both fixes above are
  properties of the *published artifact*, and the packaging one is invisible
  from source. A fake axios instance (via the existing `setAxiosInstance`) lets
  the scope tests assert on the exact URL the shipped package would request,
  with no network and no live server.

- **Add CI.** A GitHub Actions workflow builds and runs the suite on Node 22
  and 24 for every push to `main` and every pull request, and asserts the
  packed tarball contains only `dist/` plus the four metadata files. Previously
  nothing ran the tests except a maintainer remembering to.

- Sync `package-lock.json`'s recorded version with `package.json` (it had
  drifted to 5.5.0). `npm ci` only enforces dependency sync, so this was
  cosmetic rather than breaking.

## 5.5.0

- Relicense under LGPL-3.0-or-later.
- Upgrade dependencies to latest (axios ^1.19.0 — includes fixes for
  known axios CVEs such as the DoS via unbounded data size,
  CVE-2025-58754 — plus eslint 10, typescript 5.9.3, @types/node 26).

## 5.3.4

- Add `Dmart.getPlugins()` for the new dmart server `GET /info/plugins`
  endpoint. Returns the standard Response envelope; each `records[i]`
  carries `attributes.version` (the version the plugin announces from its
  own binary) and `attributes.type` (`"hook"` | `"api"`). Pairs with the
  cxb tools/info `Plugins` tab.

## 5.3.1

- Ship compiled `dist/*.js` + `dist/*.d.ts` instead of raw `.ts` source.
  Consumers' type-checkers (svelte-check, tsc with strict flags) no longer
  walk our source and apply their own rules — `skipLibCheck` now works as
  expected and false-positive errors under `verbatimModuleSyntax` go away.
- Add `"exports"` field with root + `./dmart.model` + `./dmart.service`
  subpath entries. Library imports via `@edraj/tsdmart`, `@edraj/tsdmart/dmart.model`,
  and `@edraj/tsdmart/dmart.service` all resolve to their compiled forms.
- Add `"files": ["dist", "README.md", "LICENSE", "CHANGELOG.md"]` so npm
  publishes only the artifacts consumers need.
- Trim `tsconfig.json` to library settings: remove `paths`, `types`,
  `allowJs`/`checkJs`, `.routify` cruft. Add `declaration`, `declarationMap`,
  `outDir: "dist"`.

## 1.0.12

- Use type-only imports in `dmart.service.ts` for compatibility with `verbatimModuleSyntax`.

## 1.0.10

- Implementing DMART apis up to 1.3.x

## 1.0.8

- Implementing DMART apis up to 1.1.x

## 1.0.0

- Initial version.

