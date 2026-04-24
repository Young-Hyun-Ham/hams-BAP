export type Role = "guest" | "user" | "admin" | string;
export type AiChatType = "gpt" | "gemini" | "claude";

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
  aiChatType?: AiChatType;
  apiKey?: string | null;
  chatModel?: string | null;
  termsAcceptedAt?: string | null;
  termsVersion?: string | null;
}

export interface UserSearchParams {
  keyword?: string;
}

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
  aiChatType?: AiChatType;
  apiKey?: string | null;
  chatModel?: string | null;
  termsAcceptedAt?: string | null;
  termsVersion?: string | null;
  lastLoginAt?: string;
  password?: string;
}
