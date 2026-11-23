// The calls 5.10.0 changed to follow dmart 1.6.12 – 1.7.10: what each sends,
// where, and the methods removed because csdmart never served their routes.
import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  Dmart,
  ContentType,
  DmartErrorCode,
  ErrorType,
  HealthType,
  OtpPurpose,
  QueryType,
  ResourceType,
  UserType,
} from "../dist/index.js";

const ok = { status: "success", records: [], attributes: {} };

// Records every call as {method, url, body, config} and answers `ok`.
function installServer(answer = ok) {
  const calls = [];
  const handler = (method) => async (url, a, b) => {
    const [body, config] = method === "get" ? [undefined, a] : [a, b];
    calls.push({ method, url, body, config });
    return { status: 200, data: answer };
  };
  Dmart.setAxiosInstance({
    defaults: { baseURL: "https://example.test/dmart" },
    get: handler("get"),
    post: handler("post"),
    put: handler("put"),
  });
  return calls;
}

describe("sign-in", () => {
  let calls;
  beforeEach(() => { calls = installServer(); Dmart.setDeviceId(null); });
  afterEach(() => { Dmart.setDeviceId(null); Dmart.clearToken(); });

  test("login without options sends shortname and password only", async () => {
    await Dmart.login("alice", "pw");
    assert.deepEqual(calls[0].body, { shortname: "alice", password: "pw" });
    assert.equal(calls[0].config.headers["X-DeviceId"], undefined);
  });

  test("login sends otp and device_id for the second step", async () => {
    await Dmart.login("alice", "pw", { otp: "123456", device_id: "phone-1" });
    assert.equal(calls[0].url, "user/login");
    assert.deepEqual(calls[0].body, { shortname: "alice", password: "pw", otp: "123456", device_id: "phone-1" });
  });

  test("setDeviceId sends X-DeviceId on login and loginBy", async () => {
    Dmart.setDeviceId("phone-2");
    assert.equal(Dmart.getDeviceId(), "phone-2");
    await Dmart.login("alice", "pw");
    await Dmart.loginBy({ email: "a@example.test", otp: "1" }, "pw");
    assert.equal(calls[0].config.headers["X-DeviceId"], "phone-2");
    assert.equal(calls[1].config.headers["X-DeviceId"], "phone-2");
    assert.deepEqual(calls[1].body, { email: "a@example.test", otp: "1", password: "pw" });
  });

  test("X-DeviceId goes only to sign-in, not to other calls", async () => {
    Dmart.setDeviceId("phone-3");
    await Dmart.getProfile();
    assert.equal(calls[0].config.headers["X-DeviceId"], undefined);
  });

  test("setDeviceId(null) stops sending it", async () => {
    Dmart.setDeviceId("phone-4");
    Dmart.setDeviceId(null);
    await Dmart.login("alice", "pw");
    assert.equal(calls[0].config.headers["X-DeviceId"], undefined);
  });
});

describe("accounts", () => {
  let calls;
  beforeEach(() => { calls = installServer(); });

  test("passwordResetConfirm posts the code, password and identifier", async () => {
    await Dmart.passwordResetConfirm({ email: "a@example.test", otp: "123456", password: "New-pass1" });
    assert.equal(calls[0].method, "post");
    assert.equal(calls[0].url, "user/password-reset-confirm");
    assert.deepEqual(calls[0].body, { email: "a@example.test", otp: "123456", password: "New-pass1" });
  });

  test("createUser sends a chosen shortname and the register codes", async () => {
    const request = { shortname: "alice", attributes: { email: "a@example.test", password: "pw", email_otp: "123456" } };
    await Dmart.createUser(request);
    assert.equal(calls[0].url, "user/create");
    assert.deepEqual(calls[0].body, request);
  });

  test("confirmOtp carries password and current_code", async () => {
    await Dmart.confirmOtp({ code: "1", email: "new@example.test", password: "pw" });
    await Dmart.confirmOtp({ code: "2", msisdn: "9647000000000", current_code: "3" });
    assert.equal(calls[0].url, "user/verify-contact");
    assert.deepEqual(calls[0].body, { code: "1", email: "new@example.test", password: "pw" });
    assert.deepEqual(calls[1].body, { code: "2", msisdn: "9647000000000", current_code: "3" });
  });

  test("otpRequest still posts the purpose", async () => {
    await Dmart.otpRequest({ email: "a@example.test", purpose: OtpPurpose.reset });
    assert.deepEqual(calls[0].body, { email: "a@example.test", purpose: "reset" });
  });
});

describe("routes", () => {
  let calls;
  beforeEach(() => { calls = installServer(); });

  test("getSpaceHealth defaults to the soft check", async () => {
    await Dmart.getSpaceHealth("demo");
    assert.equal(calls[0].method, "get");
    assert.equal(calls[0].url, "managed/health/soft/demo");
  });

  test("getSpaceHealth takes the check type", async () => {
    await Dmart.getSpaceHealth("demo", HealthType.all);
    assert.equal(calls[0].url, "managed/health/all/demo");
  });

  test("getClientConfig reads public/client-config", async () => {
    const config = { status: "success", attributes: { otp_length: 6, default_query_limit: 10, username_hint: "a-z" } };
    calls = installServer(config);
    const data = await Dmart.getClientConfig();
    assert.equal(calls[0].url, "public/client-config");
    assert.equal(data.attributes.otp_length, 6);
  });

  test("getClientConfig sends no token, and leaves the stored one alone", async () => {
    Dmart.setToken("stale-token");
    try {
      await Dmart.getClientConfig();
      assert.equal(calls[0].config.headers["Authorization"], undefined);
      assert.equal(Dmart.getToken(), "stale-token");
    } finally {
      Dmart.clearToken();
    }
  });

  const query = () => ({ type: QueryType.search, space_name: "demo", subpath: "/content", search: "" });

  test("csv posts managed/csv, or ?preview=1 when asked", async () => {
    await Dmart.csv(query());
    await Dmart.csv(query(), { preview: true });
    assert.equal(calls[0].url, "managed/csv");
    assert.equal(calls[1].url, "managed/csv?preview=1");
  });

  test("csv keeps the caller's sort and leaves their query object untouched", async () => {
    const q = { ...query(), subpath: "//content", sort_by: "shortname" };
    await Dmart.csv(q);
    assert.equal(calls[0].body.sort_by, "shortname");
    assert.equal(calls[0].body.subpath, "/content");
    assert.deepEqual(q, { ...query(), subpath: "//content", sort_by: "shortname" });
  });

  test("csv asks for text and resolves to the CSV itself", async () => {
    const csvText = "shortname,uuid\nalpha,1\n";
    calls = installServer(csvText);
    const data = await Dmart.csv(query());
    assert.equal(calls[0].config.responseType, "text");
    assert.equal(data, csvText);
  });

  test("csv preview still reads JSON", async () => {
    await Dmart.csv(query(), { preview: true });
    assert.equal(calls[0].config.responseType, undefined);
  });

  test("a refused csv rejects with dmart's error envelope, parsed", async () => {
    const envelope = { status: "failed", error: { type: "request", code: 202, message: "empty body" } };
    Dmart.setAxiosInstance({
      defaults: { baseURL: "https://example.test/dmart" },
      post: async () => {
        const err = new Error("Request failed with status code 400");
        err.response = { status: 400, data: JSON.stringify(envelope) };
        throw err;
      },
    });
    await assert.rejects(Dmart.csv(query()), (err) => {
      assert.deepEqual(err.response.data, envelope);
      return true;
    });
  });

  test("csv defaults to created_at order when none is given", async () => {
    await Dmart.csv(query());
    assert.equal(calls[0].body.sort_by, "created_at");
    assert.equal(calls[0].body.sort_type, "ascending");
  });

  test("getSpaceHealth accepts the plain string form", async () => {
    await Dmart.getSpaceHealth("demo", "hard");
    assert.equal(calls[0].url, "managed/health/hard/demo");
  });

  test("query sends no validate_schema and no limit of its own", async () => {
    await Dmart.query(query());
    assert.equal("validate_schema" in calls[0].body, false);
    assert.equal("limit" in calls[0].body, false);
  });

  test("retrieveEntry no longer sends validate_schema", async () => {
    await Dmart.retrieveEntry({
      resource_type: ResourceType.content, space_name: "demo", subpath: "content", shortname: "a",
      retrieve_json_payload: true, retrieve_attachments: false, validate_schema: null,
    });
    assert.equal(calls[0].url.includes("validate_schema"), false);
    assert.match(calls[0].url, /retrieve_json_payload=true&retrieve_attachments=false$/);
  });

  test("resourcesFromCsv sends first_row", async () => {
    await Dmart.resourcesFromCsv({
      space_name: "demo", subpath: "content", resourceType: ResourceType.content, schema: "",
      payload: new Blob(["a,b\n"]), firstRow: 5,
    });
    assert.equal(calls[0].config.params.first_row, 5);
    assert.equal("is_update" in calls[0].config.params, false);
  });
});

describe("removed", () => {
  // csdmart never served /user/reset (dropped June 2026) or /managed/data-asset.
  for (const name of ["userReset", "fetchDataAsset"]) {
    test(`${name} is gone`, () => assert.equal(typeof Dmart[name], "undefined"));
  }
});

describe("enums", () => {
  test("new values", () => {
    assert.equal(UserType.admin, "admin");
    assert.equal(ContentType.binary, "binary");
    assert.equal(ErrorType.server, "server");
    assert.deepEqual(Object.values(HealthType), ["soft", "hard", "all"]);
  });

  test("error codes match dmart's InternalErrorCode", () => {
    assert.equal(DmartErrorCode.OTP_NEEDED, 115);
    assert.equal(DmartErrorCode.OTP_INVALID, 307);
    assert.equal(DmartErrorCode.OTP_EXPIRED, 308);
    assert.equal(DmartErrorCode.USER_ISNT_VERIFIED, 11);
    assert.equal(DmartErrorCode.USER_ACCOUNT_LOCKED, 110);
    assert.equal(DmartErrorCode.CONFLICT, 409);
    assert.equal(DmartErrorCode.INVALID_TICKET_STATUS, 300);
    assert.equal(DmartErrorCode.PASSWORD_RESET_ERROR, 102);
    assert.equal(DmartErrorCode.INVALID_DATA, 402);
    assert.equal(DmartErrorCode.NOT_ALLOWED, 401);
    assert.equal(DmartErrorCode.PASSWORD_HASHING_BUSY, 503);
    assert.equal(DmartErrorCode.REQUEST_TIMEOUT, 504);
    assert.equal(DmartErrorCode.INVALID_USERNAME_AND_PASS, 10);
    assert.equal(DmartErrorCode.SESSION, 50);
    assert.equal(DmartErrorCode.OTP_RESEND_BLOCKED, 103);
    assert.equal(DmartErrorCode.SHORTNAME_ALREADY_EXIST, 400);
    assert.equal(DmartErrorCode.DATA_SHOULD_BE_UNIQUE, 415);
    assert.equal(DmartErrorCode.MISSING_DATA, 202);
    assert.equal(DmartErrorCode.INVALID_ROUTE, 230);
  });

  test("DmartErrorCode carries the same 21 codes as pydmart and flutterdmart", () => {
    const names = Object.keys(DmartErrorCode).filter((k) => isNaN(Number(k)));
    assert.equal(names.length, 21);
  });
});
