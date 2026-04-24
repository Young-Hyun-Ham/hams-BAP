import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebaseAdmin";
import type { aiChatTypes } from "@/types/user";
import type { SsoExchangeUser } from "@/lib/sso";

import { decryptApiKey, encryptApiKey } from "@/lib/api-key";

const USERS_COLLECTION = "users";

export type MemberAiChatType = Exclude<aiChatTypes, "">;

export type MemberProfile = {
  id: string;
  sub: string;
  email: string | null;
  emailLower: string | null;
  name: string | null;
  nickname: string | null;
  loginId: string | null;
  loginIdLower: string | null;
  phoneNumber: string | null;
  provider: string | null;
  providerSubject: string | null;
  roles: string[];
  aiEnabled: boolean;
  aiChatType: MemberAiChatType;
  apiKey: string;
  chatModel: string;
  avatarUrl: string | null;
  termsAcceptedAt: string | null;
  termsVersion: string | null;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
};

function normalizeString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function toIsoString(value: unknown) {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "object" && value && "toDate" in value && typeof (value as Timestamp).toDate === "function") {
    return (value as Timestamp).toDate().toISOString();
  }

  return null;
}

export function getDefaultChatModel(aiChatType: MemberAiChatType) {
  switch (aiChatType) {
    case "gemini":
      return "gemini-2.0-flash";
    case "claude":
      return "claude-3-5-sonnet-latest";
    case "gpt":
    default:
      return "gpt-3.5-turbo";
  }
}

export function normalizeAiChatType(value: unknown): MemberAiChatType {
  if (value === "gemini" || value === "claude") {
    return value;
  }

  return "gpt";
}

export function normalizeMemberProfile(id: string, raw: Record<string, unknown> | undefined | null): MemberProfile {
  const email = normalizeString(raw?.email);
  const nickname = normalizeString(raw?.nickname);
  const loginId = normalizeString(raw?.loginId);
  const aiChatType = normalizeAiChatType(raw?.aiChatType);

  return {
    id,
    sub: normalizeString(raw?.sub) ?? id,
    email,
    emailLower: normalizeString(raw?.emailLower) ?? (email ? email.toLowerCase() : null),
    name: normalizeString(raw?.name) ?? nickname,
    nickname,
    loginId,
    loginIdLower: normalizeString(raw?.loginIdLower) ?? (loginId ? loginId.toLowerCase() : null),
    phoneNumber: normalizeString(raw?.phoneNumber),
    provider: normalizeString(raw?.provider),
    providerSubject: normalizeString(raw?.providerSubject),
    roles: Array.isArray(raw?.roles) ? raw.roles.filter((role): role is string => typeof role === "string" && role.trim().length > 0) : ["user"],
    aiEnabled: typeof raw?.aiEnabled === "boolean" ? raw.aiEnabled : true,
    aiChatType,
    apiKey: decryptApiKey(normalizeString(raw?.apiKey)) ?? "",
    chatModel: normalizeString(raw?.chatModel) ?? getDefaultChatModel(aiChatType),
    avatarUrl: normalizeString(raw?.avatar_url) ?? normalizeString(raw?.avatarUrl),
    termsAcceptedAt: toIsoString(raw?.termsAcceptedAt),
    termsVersion: normalizeString(raw?.termsVersion),
    createdAt: toIsoString(raw?.createdAt) ?? "",
    updatedAt: toIsoString(raw?.updatedAt) ?? "",
    lastLoginAt: toIsoString(raw?.lastLoginAt),
  };
}

export async function getMemberProfileById(userId: string) {
  const snap = await adminDb.collection(USERS_COLLECTION).doc(userId).get();

  if (!snap.exists) {
    return null;
  }

  return normalizeMemberProfile(snap.id, snap.data() as Record<string, unknown>);
}

export function buildSsoUserMergeData(ssoUser: SsoExchangeUser) {
  const email = normalizeString(ssoUser.email);
  const loginId = normalizeString(ssoUser.loginId);
  const nickname = normalizeString(ssoUser.nickname);
  const aiChatType = normalizeAiChatType(ssoUser.aiChatType);
  const now = FieldValue.serverTimestamp();
  const createdAt = normalizeString(ssoUser.createdAt);
  const updatedAt = normalizeString(ssoUser.updatedAt);

  const saveData: Record<string, unknown> = {
    sub: ssoUser.id,
    email,
    emailLower: normalizeString(ssoUser.emailLower) ?? (email ? email.toLowerCase() : null),
    name: nickname,
    nickname,
    loginId,
    loginIdLower: normalizeString(ssoUser.loginIdLower) ?? (loginId ? loginId.toLowerCase() : null),
    phoneNumber: normalizeString(ssoUser.phoneNumber),
    provider: normalizeString(ssoUser.provider) ?? "sso",
    providerSubject: normalizeString(ssoUser.providerSubject),
    roles: ["user"],
    termsAcceptedAt: normalizeString(ssoUser.termsAcceptedAt),
    termsVersion: normalizeString(ssoUser.termsVersion),
    createdAt: createdAt ?? now,
    updatedAt: updatedAt ?? now,
    lastLoginAt: now,
  };

  if (typeof ssoUser.aiEnabled === "boolean") {
    saveData.aiEnabled = ssoUser.aiEnabled;
  }

  if (ssoUser.aiChatType === "gpt" || ssoUser.aiChatType === "gemini" || ssoUser.aiChatType === "claude") {
    saveData.aiChatType = ssoUser.aiChatType;
  }

  const apiKey = normalizeString(ssoUser.apiKey);
  if (apiKey) {
    // 암호화된 API 키 저장
    saveData.apiKey = encryptApiKey(apiKey);
  }

  const chatModel = normalizeString(ssoUser.chatModel);
  if (chatModel) {
    saveData.chatModel = chatModel;
  }

  return saveData;
}

export async function upsertSsoMemberProfile(ssoUser: SsoExchangeUser) {
  const ref = adminDb.collection(USERS_COLLECTION).doc(ssoUser.id);
  const snap = await ref.get();
  const saveData = buildSsoUserMergeData(ssoUser);

  if (!snap.exists) {
    await ref.set(saveData, { merge: true });
    return;
  }

  await ref.set(saveData, { merge: true });
}
