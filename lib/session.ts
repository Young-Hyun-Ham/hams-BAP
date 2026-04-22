import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";

import { User } from "@/types/user";

const SESSION_MAX_AGE_SEC = Number(
  process.env.HAMS_SSO_SESSION_MAX_AGE_SEC ?? 60 * 60 * 24 * 7,
);

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

function sign(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

function encode(payload: SessionPayload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

function decode(token: string) {
  const [body, signature] = token.split(".");

  if (!body || !signature) {
    return null;
  }

  const expected = sign(body);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (signatureBuffer.length !== expectedBuffer.length) {
    return null;
  }

  if (!timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;
  } catch {
    return null;
  }
}

export async function createSessionToken(user: SessionUser) {
  const issuedAt = Date.now();
  const expiresAt = issuedAt + SESSION_MAX_AGE_SEC * 1000;

  return encode({
    user,
    issuedAt,
    expiresAt,
  });
}

export function getUserFromToken(token?: string | null): SessionUser | null {
  if (!token) {
    return null;
  }

  const payload = decode(token);

  if (!payload || payload.expiresAt < Date.now()) {
    return null;
  }

  return payload.user;
}

export async function getSessionToken() {
  const store = await cookies();
  return store.get("access_token")?.value ?? null;
}

export async function getUserServer(): Promise<User | null> {
  const token = await getSessionToken();
  return getUserFromToken(token);
}
