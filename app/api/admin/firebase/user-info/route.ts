import bcrypt from "bcryptjs";
import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

import { adminDb } from "@/lib/firebaseAdmin";
import {
  getDefaultChatModel,
  normalizeAiChatType,
  normalizeMemberProfile,
} from "@/lib/member-profile";

export type Role = "guest" | "user" | "admin" | string;

export interface UserUpsertPayload {
  id?: string;
  sub?: string;
  email?: string | null;
  name?: string | null;
  nickname?: string | null;
  loginId?: string | null;
  phoneNumber?: string | null;
  avatarUrl?: string | null;
  roles?: Role[];
  provider?: string | null;
  providerSubject?: string | null;
  aiEnabled?: boolean;
  aiChatType?: "gpt" | "gemini" | "claude";
  apiKey?: string | null;
  chatModel?: string | null;
  termsAcceptedAt?: string | null;
  termsVersion?: string | null;
  lastLoginAt?: string;
  password?: string;
}

export interface AdminUser {
  id: string;
  sub: string;
  email: string | null;
  emailLower?: string | null;
  name: string | null;
  nickname?: string | null;
  loginId?: string | null;
  loginIdLower?: string | null;
  phoneNumber?: string | null;
  avatarUrl: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  roles: Role[];
  provider: string | null;
  providerSubject?: string | null;
  aiEnabled?: boolean;
  aiChatType?: "gpt" | "gemini" | "claude";
  apiKey?: string | null;
  chatModel?: string | null;
  termsAcceptedAt?: string | null;
  termsVersion?: string | null;
}

const COLLECTION = "users";
const ROUNDS = parseInt(process.env.BCRYPT_ROUNDS ?? "12", 10);

function generateRandomPassword(length = 16) {
  return Array.from({ length }, () => Math.floor(Math.random() * 36).toString(36)).join("");
}

function normalizeText(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const keyword = (searchParams.get("keyword") ?? "").trim().toLowerCase();

    const snap = await adminDb.collection(COLLECTION).orderBy("createdAt", "desc").get();

    let items: AdminUser[] = snap.docs.map((doc) => {
      const normalized = normalizeMemberProfile(doc.id, doc.data() as Record<string, unknown>);

      return {
        id: normalized.id,
        sub: normalized.sub,
        email: normalized.email,
        emailLower: normalized.emailLower,
        name: normalized.name,
        nickname: normalized.nickname,
        loginId: normalized.loginId,
        loginIdLower: normalized.loginIdLower,
        phoneNumber: normalized.phoneNumber,
        avatarUrl: normalized.avatarUrl,
        createdAt: normalized.createdAt,
        lastLoginAt: normalized.lastLoginAt,
        roles: normalized.roles,
        provider: normalized.provider,
        providerSubject: normalized.providerSubject,
        aiEnabled: normalized.aiEnabled,
        aiChatType: normalized.aiChatType,
        apiKey: normalized.apiKey,
        chatModel: normalized.chatModel,
        termsAcceptedAt: normalized.termsAcceptedAt,
        termsVersion: normalized.termsVersion,
      };
    });

    if (keyword) {
      items = items.filter((user) =>
        [
          user.name ?? "",
          user.nickname ?? "",
          user.email ?? "",
          user.loginId ?? "",
          user.sub ?? "",
          user.phoneNumber ?? "",
        ].some((value) => value.toLowerCase().includes(keyword)),
      );
    }

    return NextResponse.json({ items });
  } catch (error) {
    console.error("admin firebase users list error:", error);
    return NextResponse.json(
      { error: "사용자 목록 조회에 실패했습니다." },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as UserUpsertPayload;
    const docId = payload.sub?.trim() || payload.id?.trim() || "";

    if (!docId) {
      return NextResponse.json({ error: "sub 또는 id가 필요합니다." }, { status: 400 });
    }

    const ref = adminDb.collection(COLLECTION).doc(docId);
    const snap = await ref.get();
    const isNew = !snap.exists;

    let passwordHash: string | undefined;
    if (payload.password && payload.password.trim().length > 0) {
      passwordHash = await bcrypt.hash(payload.password.trim(), ROUNDS);
    } else if (isNew) {
      passwordHash = await bcrypt.hash(generateRandomPassword(), ROUNDS);
    }

    const email = normalizeText(payload.email);
    const loginId = normalizeText(payload.loginId);
    const nickname = normalizeText(payload.nickname);
    const aiChatType = normalizeAiChatType(payload.aiChatType);
    const chatModel = normalizeText(payload.chatModel) ?? getDefaultChatModel(aiChatType);

    const saveData: Record<string, unknown> = {
      sub: docId,
      email,
      emailLower: email ? email.toLowerCase() : null,
      name: normalizeText(payload.name) ?? nickname,
      nickname,
      loginId,
      loginIdLower: loginId ? loginId.toLowerCase() : null,
      phoneNumber: normalizeText(payload.phoneNumber),
      avatar_url: normalizeText(payload.avatarUrl),
      roles: payload.roles?.length ? payload.roles : ["guest"],
      provider: normalizeText(payload.provider),
      providerSubject: normalizeText(payload.providerSubject),
      aiEnabled: typeof payload.aiEnabled === "boolean" ? payload.aiEnabled : true,
      aiChatType,
      apiKey: normalizeText(payload.apiKey) ?? "",
      chatModel,
      termsAcceptedAt: normalizeText(payload.termsAcceptedAt),
      termsVersion: normalizeText(payload.termsVersion),
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (isNew) {
      saveData.createdAt = FieldValue.serverTimestamp();
    }

    if (payload.lastLoginAt) {
      saveData.lastLoginAt = payload.lastLoginAt;
    }

    if (passwordHash) {
      saveData.password = passwordHash;
      saveData.passwordHash = passwordHash;
    }

    await ref.set(saveData, { merge: true });

    const result: AdminUser = {
      id: docId,
      sub: docId,
      email,
      emailLower: email ? email.toLowerCase() : null,
      name: normalizeText(payload.name) ?? nickname,
      nickname,
      loginId,
      loginIdLower: loginId ? loginId.toLowerCase() : null,
      phoneNumber: normalizeText(payload.phoneNumber),
      avatarUrl: normalizeText(payload.avatarUrl),
      createdAt: "",
      lastLoginAt: payload.lastLoginAt ?? "",
      roles: payload.roles?.length ? payload.roles : ["guest"],
      provider: normalizeText(payload.provider),
      providerSubject: normalizeText(payload.providerSubject),
      aiEnabled: typeof payload.aiEnabled === "boolean" ? payload.aiEnabled : true,
      aiChatType,
      apiKey: normalizeText(payload.apiKey) ?? "",
      chatModel,
      termsAcceptedAt: normalizeText(payload.termsAcceptedAt),
      termsVersion: normalizeText(payload.termsVersion),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("admin firebase users upsert error:", error);
    return NextResponse.json(
      { error: "사용자 저장에 실패했습니다." },
      { status: 500 },
    );
  }
}
