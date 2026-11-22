// Security keys in the browser (dmart 1.8.1+). dmart sends WebAuthn options as
// JSON with base64url fields; navigator.credentials wants ArrayBuffers, and
// dmart wants the answer back as JSON with base64url fields. These need a
// browser (or a WebView) with WebAuthn; elsewhere keysSupported() is false.
import type { KeyAnswer, KeyChallenge, SecondFactorStep } from "./dmart.model.js";

/** Whether this environment can ask a security key. */
export function keysSupported(): boolean {
    return typeof globalThis !== "undefined"
        && typeof (globalThis as { PublicKeyCredential?: unknown }).PublicKeyCredential === "function"
        && typeof globalThis.navigator?.credentials?.get === "function";
}

/**
 * The second step a failed sign-in asks for, or null: `error.info[0]` of an
 * `OTP_NEEDED` (115) or `SECOND_FACTOR_REQUIRED` (116) answer. Takes what
 * `Dmart.login` threw (an axios error) or the response body itself.
 */
export function secondFactorStep(error: unknown): SecondFactorStep | null {
    const e = error as { response?: { data?: unknown }; error?: unknown } | null;
    const body = (e?.response?.data ?? e) as { error?: { info?: unknown } } | null;
    const info = body?.error?.info;
    const step = Array.isArray(info) ? info[0] : null;
    return step && typeof step === "object" && Array.isArray((step as SecondFactorStep).factors)
        ? (step as SecondFactorStep)
        : null;
}

function decode(s: string): ArrayBuffer {
    const b64 = s.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(s.length / 4) * 4, "=");
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes.buffer;
}

function encode(buf: ArrayBuffer): string {
    const bytes = new Uint8Array(buf);
    let s = "";
    for (const b of bytes) s += String.fromCharCode(b);
    return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

type Descriptor = { id: string; type: string; transports?: string[] };

function descriptors(list: unknown): PublicKeyCredentialDescriptor[] {
    return ((list as Descriptor[] | undefined) ?? []).map((c) => ({
        ...c,
        id: decode(c.id),
        type: "public-key" as const,
        transports: c.transports as AuthenticatorTransport[] | undefined,
    }));
}

/** Asks the key to sign a challenge from dmart: the answer to send back. */
export async function signChallenge(challenge: KeyChallenge): Promise<KeyAnswer> {
    const options = challenge.options;
    const publicKey = {
        ...options,
        challenge: decode(options.challenge as string),
        allowCredentials: descriptors(options.allowCredentials),
    } as PublicKeyCredentialRequestOptions;
    const credential = (await navigator.credentials.get({ publicKey })) as PublicKeyCredential;
    const response = credential.response as AuthenticatorAssertionResponse;
    return {
        challenge_id: challenge.challenge_id,
        credential: {
            id: credential.id,
            rawId: encode(credential.rawId),
            type: credential.type,
            clientExtensionResults: credential.getClientExtensionResults(),
            response: {
                authenticatorData: encode(response.authenticatorData),
                clientDataJSON: encode(response.clientDataJSON),
                signature: encode(response.signature),
                userHandle: response.userHandle ? encode(response.userHandle) : null,
            },
        },
    };
}

/** Asks the browser to make a new key for the account: the answer to send back. */
export async function makeKey(challenge: KeyChallenge): Promise<KeyAnswer> {
    const options = challenge.options;
    const user = options.user as { id: string; name: string; displayName: string };
    const publicKey = {
        ...options,
        challenge: decode(options.challenge as string),
        user: { ...user, id: decode(user.id) },
        excludeCredentials: descriptors(options.excludeCredentials),
    } as PublicKeyCredentialCreationOptions;
    const credential = (await navigator.credentials.create({ publicKey })) as PublicKeyCredential;
    const response = credential.response as AuthenticatorAttestationResponse;
    return {
        challenge_id: challenge.challenge_id,
        credential: {
            id: credential.id,
            rawId: encode(credential.rawId),
            type: credential.type,
            clientExtensionResults: credential.getClientExtensionResults(),
            response: {
                attestationObject: encode(response.attestationObject),
                clientDataJSON: encode(response.clientDataJSON),
                transports: typeof response.getTransports === "function" ? response.getTransports() : [],
            },
        },
    };
}
