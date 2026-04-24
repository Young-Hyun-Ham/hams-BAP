import { createCipheriv, createHash, randomUUID } from "node:crypto";

const DEFAULT_SSO_SERVER_URL = "http://localhost:3005";
const DEFAULT_RETURN_TO = "/main";

function normalizeBaseUrl(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

export function getSsoServerUrl() {
  return normalizeBaseUrl(
    process.env.HAMS_OAUTH_SERVER_URL ||
      process.env.NEXT_PUBLIC_HAMS_OAUTH_SERVER_URL ||
      DEFAULT_SSO_SERVER_URL,
  );
}

export function getSsoClientId() {
  return process.env.HAMS_OAUTH_CLIENT_ID || "";
}

export function getSsoClientSecret() {
  return process.env.HAMS_OAUTH_CLIENT_SECRET || "";
}

export function getAppBaseUrl() {
  return normalizeBaseUrl(
    process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_ORIGIN ||
      "http://localhost:3000",
  );
}

export function getSsoCallbackUrl() {
  return `${getAppBaseUrl()}/api/sso/callback`;
}

export function normalizeReturnTo(value: string | null | undefined) {
  if (!value) {
    return DEFAULT_RETURN_TO;
  }

  if (!value.startsWith("/")) {
    return DEFAULT_RETURN_TO;
  }

  if (value.startsWith("//")) {
    return DEFAULT_RETURN_TO;
  }

  return value;
}

export function buildSsoStartUrl(state: string) {
  const clientId = getSsoClientId();

  if (!clientId) {
    throw new Error("HAMS_OAUTH_CLIENT_ID is not configured.");
  }

  const url = new URL("/sso/start", getSsoServerUrl());
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", getSsoCallbackUrl());
  url.searchParams.set("state", state);
  return url.toString();
}

function getEncryptionKey(secret: string) {
  return createHash("sha256").update(secret).digest();
}

function encryptLogoutToken(payload: object, secret: string) {
  const iv = Buffer.from(randomUUID().replace(/-/g, "").slice(0, 24), "hex");
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(secret), iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(payload), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [
    iv.toString("base64url"),
    encrypted.toString("base64url"),
    tag.toString("base64url"),
  ].join(".");
}

export function buildServiceLoginUrl(returnTo?: string) {
  const url = new URL("/api/sso/login", getAppBaseUrl());
  url.searchParams.set("returnTo", normalizeReturnTo(returnTo));
  return url.toString();
}

export function buildSsoLogoutUrl(returnTo?: string) {
  const clientId = getSsoClientId();
  const clientSecret = getSsoClientSecret();

  if (!clientId || !clientSecret) {
    throw new Error("HAMS_OAUTH_CLIENT_ID or HAMS_OAUTH_CLIENT_SECRET is not configured.");
  }

  const normalizedReturnTo = normalizeReturnTo(returnTo);
  const payload = {
    logout: true,
    service: clientId,
    returnTo: `${getAppBaseUrl()}${normalizedReturnTo}`,
    loginStartUrl: buildServiceLoginUrl(normalizedReturnTo),
    issuedAt: Date.now(),
    expiresAt: Date.now() + 1000 * 60 * 10,
  };

  const url = new URL("/sso/logout", getSsoServerUrl());
  url.searchParams.set("sso_logout_token", encryptLogoutToken(payload, clientSecret));
  return url.toString();
}

export type SsoExchangeUser = {
  id: string;
  loginId?: string;
  loginIdLower?: string;
  email: string;
  emailLower?: string;
  nickname?: string;
  phoneNumber?: string;
  provider?: string;
  providerSubject?: string;
  aiEnabled?: boolean;
  aiChatType?: "gpt" | "gemini" | "claude";
  apiKey?: string;
  chatModel?: string;
  termsAcceptedAt?: string | null;
  termsVersion?: string | null;
  passwordHash?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export async function exchangeSsoCode(code: string) {
  const clientId = getSsoClientId();
  const clientSecret = getSsoClientSecret();
  const redirectUri = getSsoCallbackUrl();

  if (!clientId || !clientSecret) {
    throw new Error("HAMS_OAUTH_CLIENT_ID or HAMS_OAUTH_CLIENT_SECRET is not configured.");
  }

  const response = await fetch(new URL("/api/sso/exchange", getSsoServerUrl()), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
  });

  const payload = (await response.json().catch(() => null)) as
    | { ok?: boolean; error?: string; user?: SsoExchangeUser }
    | null;

  if (!response.ok || !payload?.ok || !payload.user) {
    throw new Error(payload?.error || "sso_exchange_failed");
  }

  return payload.user;
}
