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

