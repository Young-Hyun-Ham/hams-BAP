import type { User } from "@/types/user";

type SessionUser = User & {
  username?: string;
  nickname?: string;
  loginId?: string;
};

type SessionPayload = {
  user: SessionUser;
  issuedAt: number;
  expiresAt: number;
};

function getSessionSecret() {
  return (
    process.env.HAMS_BAP_SESSION_SECRET ||
    process.env.JWT_SECRET ||
    "dev-hams-bap-session-secret"
  );
}

function base64UrlToUint8Array(input: string) {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

function base64UrlToString(input: string) {
  const bytes = base64UrlToUint8Array(input);
  return new TextDecoder().decode(bytes);
}

async function sign(value: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value),
  );

  const bytes = new Uint8Array(signature);
  let binary = "";

  for (const b of bytes) {
    binary += String.fromCharCode(b);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function decodeSessionToken(token: string) {
  const [body, signature] = token.split(".");

  if (!body || !signature) {
    return null;
  }

  const expected = await sign(body);

  if (signature !== expected) {
    return null;
  }

  try {
    return JSON.parse(base64UrlToString(body)) as SessionPayload;
  } catch {
    return null;
  }
}

export async function getUserFromToken(token?: string | null) {
  if (!token) {
    return null;
  }

  const payload = await decodeSessionToken(token);

  if (!payload || payload.expiresAt < Date.now()) {
    return null;
  }

  return payload.user;
}
