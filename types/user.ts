// types/user.ts
export type roleTypes = "guest" | "admin" | "user" | "";
export type aiChatTypes = "gpt" | "gemini" | "claude" | "";

export type User = {
  id: string;
  sub: string;
  email: string;
  username: string;
  name?: string | null;
  nickname?: string | null;
  loginId?: string | null;
  loginIdLower?: string | null;
  emailLower?: string | null;
  roles?: roleTypes[];
  provider?: string;
  providerSubject?: string | null;
  phoneNumber?: string | null;
  accessToken?: string;
  refreshToken?: string;
  aiEnabled?: boolean;
  aiChatType?: aiChatTypes;
  apiKey?: string | null;
  chatModel?: string | null;
  termsAcceptedAt?: string | null;
  termsVersion?: string | null;
  passwordHash?: string | null;
  avatar_url?: string;
  createdAt?: string | null;
  updatedAt?: string | null;
  lastLoginAt?: string | null;
  isTestUser?: boolean;
}
