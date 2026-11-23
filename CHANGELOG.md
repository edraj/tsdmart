## 5.12.0

**Compatibility:** the second-factor calls need csdmart ≥ 1.8.1; the rest is
unchanged.

### Added

- **Second factors at sign-in:** `login` and `loginBy` take the second
  step's `webauthn` (a security key's answer), `totp` (an authenticator app's
  code) or `recovery_code`. `secondFactorStep(error)` reads the step an
  `OTP_NEEDED` (115) or `SECOND_FACTOR_REQUIRED` (116) answer asks for.
- **In a browser:** `loginWithSecurityKey(shortname, password)` does the
  password and the key in one call; `loginWithKeyAlone(account)` is key-only
  sign-in, for an account that turned it on (`keyOnlyChallenge` gives the
  challenge). `signChallenge`, `makeKey` and `keysSupported` convert between
  dmart's JSON and `navigator.credentials`, also from
  `@edraj/tsdmart/webauthn`.
- **The account's second factors:** `getSecondFactors`, the key calls
  (`passkeyProofChallenge`, `passkeyRegisterChallenge`, `passkeyRegister`,
  `passkeyRename`, `passkeyRemove`), `newRecoveryCodes`, `setKeyOnly`, and an
  authenticator app's `totpBegin`, `totpConfirm` and `totpRemove`.
- **`DmartErrorCode`** gains `SECOND_FACTOR_REQUIRED` (116) and
  `SECOND_FACTOR_INVALID` (117), as pydmart and flutterdmart do.

## 5.11.0

**Compatibility:** `loginClientCredentials` needs csdmart ≥ 1.8.0; the rest is
unchanged.

### Added

- **`loginClientCredentials(clientId, clientSecret, {resource, tokenUrl})`:**
  a service signs in with its own token (OAuth 2 `client_credentials` at
  `oidc/token`) instead of a bot's password. The token is kept like a
  login's, and a call made when less than min(30 s, half its lifetime)
  remains gets a new one first; concurrent calls share one renewal. A
  refusal throws with the endpoint's OAuth error as the message
  (`invalid_client: ...`) and its `status`. `setToken`, `clearToken`, a
  password login or `logout` ends the renewal. For services only: a browser
  or an app can't keep a client secret. Typed as `ClientCredentialsOptions`
  and `ClientCredentialsToken`.
- **`ResourceType`** gains `data_asset`, `lock`, `log`, `reply`, `share` and
  `integration`, the types dmart has and the enum lacked.

## 5.10.0

**Compatibility:** requires csdmart ≥ 1.6.12 (`getClientConfig` and
`getPermissions` need it; `getPermissions` falls back on older servers). A
top-level `shortname` on sign-up and the username rule in the client config
need ≥ 1.7.9. Aligned with csdmart 1.7.10.

### Added

- **`passwordResetConfirm({otp, password, shortname | email | msisdn})`**
  posts `user/password-reset-confirm`, the second half of the reset flow
  after `otpRequest({purpose: OtpPurpose.reset, ...})`.
- **`getClientConfig()`** reads `GET public/client-config` and sends no
  token, even when one is stored, so a stale one can't get in the way:
  OTP length, resend delay and lifetime, upload and query limits, the request
  timeout, and whether custom password and username rules apply, with their
  hints. Typed as `ClientConfig`.
- **Device sign-in.** `login(shortname, password, {otp, device_id})` covers
  the two-step sign-in: an admin's password sign-in (dmart 1.6.6+) and the
  first sign-in from a new device (1.7.2+) answer `OTP_NEEDED` (115) and send
  a code, and the client signs in again with the same password, the same
  `device_id` and the `otp`. `Dmart.setDeviceId(id)` sends `X-DeviceId` on
  `login` and `loginBy`; a `device_id` in the body wins. dmart 1.7.2+ refuses
  a mobile sign-in that names no device.
- **`DmartErrorCode`**: the codes clients branch on, with dmart's integers:
  `INVALID_USERNAME_AND_PASS` 10, `USER_ISNT_VERIFIED` 11, `SESSION` 50,
  `PASSWORD_RESET_ERROR` 102, `OTP_RESEND_BLOCKED` 103,
  `USER_ACCOUNT_LOCKED` 110, `OTP_NEEDED` 115, `MISSING_DATA` 202,
  `INVALID_ROUTE` 230, `INVALID_TICKET_STATUS` 300, `OTP_INVALID` 307,
  `OTP_EXPIRED` 308, `SHORTNAME_ALREADY_EXIST` 400, `NOT_ALLOWED` 401,
  `INVALID_DATA` 402, `CONFLICT` 409, `DATA_SHOULD_BE_UNIQUE` 415,
  `PASSWORD_HASHING_BUSY` 503 and `REQUEST_TIMEOUT` 504. pydmart and
  flutterdmart carry the same set under the same name. **`ErrorType`** lists the `error.type` values, including the new
  `server`.
- **`createUser({shortname?, attributes})`** (`CreateUserRequest`): a
  top-level `shortname` is the username the registrant chose, or `"auto"`
  (dmart 1.7.9+). Since dmart 1.7.10 open registration always needs
  `attributes.email_otp` / `msisdn_otp`, from `otpRequest` with purpose
  `register`. An `ActionRequestRecord` is still accepted, but its `shortname`
  is now honoured by the server as the chosen username.
- **`confirmOtp`** takes `password` or `current_code`. Changing an account's
  email or phone (dmart 1.6.7+) needs the password, or, on an account without
  one, a verify-contact code sent to the address it already has.
- **`csv(query, {preview: true})`** asks `managed/csv?preview=1` what the
  file would hold (`CsvPreviewResponse`). **`resourcesFromCsv`** takes
  `firstRow` (`?first_row=N`) to resume an upload.
- `ApiQueryResponse.attributes.total_is_lower_bound`: set when the server
  capped the count, so `total` is a lower bound.
- `UserType.admin`, `ContentType.binary`, `HealthType`, and
  `SpaceHealthResponse`.

### Changed

- **`getSpaceHealth(space, healthType = HealthType.soft)`** calls
  `managed/health/{soft|hard|all}/{space}` and is typed with the checks the
  server returns. `healthType` takes a `HealthType` or its string, so a typo
  fails to compile. Global admins only.
- **`csv()` keeps the caller's sort and leaves their query object alone.** It
  used to force `sort_by: "created_at"` and rewrite `sort_type` and `subpath`
  on the object passed in. `created_at` is now only the default when the
  query names no order.
- `QueryRequest.validate_schema` and `RetrieveEntryRequest.validate_schema`
  are deprecated (dmart ignores them), and `retrieveEntry` no longer sends
  `validate_schema`. `QueryRequest.limit` documents that leaving it out gets
  the server's default.
- `updateUser` documents that a password change needs `old_password`.

### Fixed

- **`csv()` resolves to the CSV text and is typed `Promise<string>`.** dmart
  answers `managed/csv` with the file itself (`text/csv`), but `csv()` was
  typed as a query response and asked axios for JSON; the text only survived
  because axios falls back to a string when parsing fails. It now asks for
  text. A refusal still rejects with dmart's JSON error in
  `error.response.data`. `csv(query, {preview: true})` is unchanged.
- `getSpaceHealth` called `managed/health/{space}`, a route csdmart never
  served, so it always failed.

### Removed

- **`userReset`** (`user/reset`, dropped from csdmart in June 2026) and
  **`fetchDataAsset`** (`managed/data-asset`, which csdmart never served),
  along with `FetchDataAssetRequest`. Both always failed against csdmart. Use
  `otpRequest` purpose `reset` plus `passwordResetConfirm` instead of
  `userReset`.

## 5.9.0

- **`getPermissions()` reads the permission map from its own route.** dmart
  now serves the caller's map at `GET /user/permissions` and deprecates the
  copy inside `GET /user/profile`, which made the profile the heaviest call an
  app makes on every load. `getPermissions()` returns the map and stores it in
  `localStorage["permissions"]`, where `getProfile()` has always put it, so
  code that reads the key keeps working. The route sends an ETag, so a browser
  revalidates the map instead of downloading it again. On a server without the
  route (it answers `INVALID_ROUTE`, code 230, with HTTP 422; a bare 404 counts
  too), the map comes from the profile. Any other failure throws.
- **`getProfile()` no longer overwrites a stored map with `undefined`.** It
  still writes `localStorage["permissions"]` while the profile carries the map,
  and leaves the stored value alone once a server stops sending it.
  `ProfileResponseRecord.attributes.permissions` is optional for the same
  reason. A new `PermissionsResponse` type describes the route.

## 5.8.0

- **User directory fields in the types.** `UserDirectoryFields` (`mailbox`,
  `mail_aliases`, `services`) is added to `ProfileResponseRecord.attributes`
  and to `MetaExtended`, matching what dmart returns for users once it has
  them. All three are optional, so older servers type-check unchanged. Search
  them with `@mailbox:`, `@mail_aliases:` and `@services:`.

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

- **`prepublishOnly` now runs the tests, not just the build.** It was
  `clean && build`, so `npm publish` could ship a tarball whose tests fail —
  the one path by which code reached npm without the suite running. It is now
  `clean && test` (and `npm test` builds first, so nothing is lost). Verified
  that a single failing assertion aborts `npm publish` with exit 1 *before* the
  tarball is packed, rather than merely printing red.

  Note this makes publishing require Node 22+, since the suite is discovered
  with a `node --test` glob. That is a loud failure on an old Node rather than
  a silent one, which is the right trade for a release step.

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

