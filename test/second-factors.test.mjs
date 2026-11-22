// Second factors (dmart 1.8.1+): the second step's fields on login, reading the
// step a sign-in asks for, a security key's answer in the browser, key-only
// sign-in, and an authenticator app's setup.
import { test, describe, afterEach } from "node:test";
import assert from "node:assert/strict";
import { Dmart, DmartErrorCode, secondFactorStep, keysSupported } from "../dist/index.js";

const b64url = (bytes) => Buffer.from(bytes).toString("base64url");

// A fake axios instance: each POST answers from `answers` in turn (a function
// of the call, or a body); a 401 answer throws as axios does.
function installServer(answers) {
  const calls = [];
  const queue = [...answers];
  const answer = (url, body) => {
    const next = queue.shift();
    const { status = 200, data } = typeof next === "function" ? next(url, body) : next;
    if (status >= 400) throw Object.assign(new Error(`status ${status}`), { response: { status, data } });
    return { status, data };
  };
  Dmart.setAxiosInstance({
    defaults: { baseURL: "https://example.test/dmart" },
    post: async (url, body) => { calls.push({ url, body }); return answer(url, body); },
    get: async (url) => { calls.push({ url }); return answer(url); },
  });
  return calls;
}

const signedIn = { status: "success", records: [{ resource_type: "user", shortname: "ali", subpath: "users", attributes: { access_token: "tok" } }] };
const keyStep = (challenge) => ({
  status: 401,
  data: {
    status: "failed",
    error: {
      type: "auth", code: DmartErrorCode.OTP_NEEDED, message: "Use your security key, with the password",
      info: [{ factors: ["passkey", "recovery"], webauthn: { challenge_id: "c1", options: {
        challenge: b64url(challenge), rpId: "dmart.test", userVerification: "required",
        allowCredentials: [{ type: "public-key", id: b64url([7, 7, 7]) }],
      } } }],
    },
  },
});

// A browser with one security key: it records what it was asked and answers
// with fixed bytes.
function installKey() {
  const asked = [];
  Object.defineProperty(globalThis, "PublicKeyCredential", { value: function PublicKeyCredential() {}, configurable: true });
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: { credentials: {
    get: async ({ publicKey }) => {
      asked.push(publicKey);
      const buf = (bytes) => new Uint8Array(bytes).buffer;
      return {
        id: b64url([7, 7, 7]), rawId: buf([7, 7, 7]), type: "public-key",
        getClientExtensionResults: () => ({}),
        response: { authenticatorData: buf([1, 2]), clientDataJSON: buf([3, 4]), signature: buf([5, 6]), userHandle: null },
      };
    },
  } } });
  return asked;
}

describe("second factors", () => {
  afterEach(() => Dmart.clearToken());

  test("login sends the second step's fields", async () => {
    const calls = installServer([{ data: signedIn }, { data: signedIn }]);
    await Dmart.login("ali", "pw", { totp: "123456" });
    assert.deepEqual(calls[0].body, { shortname: "ali", password: "pw", totp: "123456" });
    await Dmart.loginBy({ email: "ali@example.test" }, "pw", { recovery_code: "ABCDE-FGHJK" });
    assert.deepEqual(calls[1].body, { email: "ali@example.test", password: "pw", recovery_code: "ABCDE-FGHJK" });
    assert.equal(Dmart.getToken(), "tok");
  });

  test("secondFactorStep reads what a sign-in asks for, from the error or the body", async () => {
    installServer([keyStep([1, 2, 3])]);
    const thrown = await Dmart.login("ali", "pw").catch((e) => e);
    assert.deepEqual(secondFactorStep(thrown).factors, ["passkey", "recovery"]);
    assert.equal(secondFactorStep(thrown.response.data).webauthn.challenge_id, "c1");
    assert.equal(secondFactorStep(new Error("network")), null);
    assert.equal(secondFactorStep({ response: { data: { error: { code: 10, info: [] } } } }), null);
  });

  test("loginWithSecurityKey asks the key and sends its answer with the password", async () => {
    const asked = installKey();
    assert.equal(keysSupported(), true);
    const calls = installServer([keyStep([9, 8, 7]), { data: signedIn }]);
    const done = await Dmart.loginWithSecurityKey("ali", "pw");
    assert.equal(done.status, "success");
    // The browser got ArrayBuffers for the challenge and the key's id.
    assert.deepEqual([...new Uint8Array(asked[0].challenge)], [9, 8, 7]);
    assert.deepEqual([...new Uint8Array(asked[0].allowCredentials[0].id)], [7, 7, 7]);
    assert.equal(asked[0].rpId, "dmart.test");
    // dmart got base64url back, with the password again.
    const second = calls[1].body;
    assert.equal(second.password, "pw");
    assert.equal(second.webauthn.challenge_id, "c1");
    assert.deepEqual(second.webauthn.credential.response,
      { authenticatorData: b64url([1, 2]), clientDataJSON: b64url([3, 4]), signature: b64url([5, 6]), userHandle: null });
  });

  test("loginWithSecurityKey passes an authenticator app's step on to the caller", async () => {
    installKey();
    installServer([{ status: 401, data: { status: "failed", error: { type: "auth", code: 115, message: "",
      info: [{ factors: ["totp", "recovery"] }] } } }]);
    const thrown = await Dmart.loginWithSecurityKey("ali", "pw").catch((e) => e);
    assert.deepEqual(secondFactorStep(thrown).factors, ["totp", "recovery"]);
  });

  test("loginWithKeyAlone takes the name's challenge and sends the key's answer with no password", async () => {
    installKey();
    const calls = installServer([
      { data: { status: "success", attributes: { challenge_id: "k1", options: { challenge: b64url([4]), allowCredentials: [] } } } },
      { data: signedIn },
    ]);
    await Dmart.loginWithKeyAlone({ shortname: "ali" });
    assert.equal(calls[0].url, "user/passkeys/login-options");
    assert.deepEqual(calls[0].body, { shortname: "ali" });
    assert.equal(calls[1].url, "user/login");
    assert.equal(calls[1].body.password, undefined);
    assert.equal(calls[1].body.webauthn.challenge_id, "k1");
  });

  test("an authenticator app's setup and the account's state read their attributes", async () => {
    const calls = installServer([
      { data: { status: "success", attributes: { setup_id: "s1", secret: "GEZDGNBV", uri: "otpauth://totp/x" } } },
      { data: { status: "success", attributes: { recovery_codes: ["AAAAA-BBBBB"] } } },
      { data: { status: "success", attributes: { passkeys: [], recovery_codes_left: 9, may_add: true, key_only: false, totp: true, totp_may_add: true } } },
    ]);
    const setup = await Dmart.totpBegin({ password: "pw" });
    assert.equal(setup.setup_id, "s1");
    assert.deepEqual(calls[0].body, { password: "pw" });
    assert.deepEqual(await Dmart.totpConfirm("s1", "123456"), ["AAAAA-BBBBB"]);
    assert.deepEqual(calls[1].body, { setup_id: "s1", code: "123456" });
    const state = await Dmart.getSecondFactors();
    assert.equal(state.totp, true);
    assert.equal(calls[2].url, "user/passkeys");
  });
});
