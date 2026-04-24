import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

import {
  getDefaultChatModel,
  getMemberProfileById,
  type MemberAiChatType,
} from "@/lib/member-profile";

export type ResolvedChatConfig = {
  provider: MemberAiChatType;
  model: string;
  apiKey: string;
  source: "member" | "env";
};

function stringifyContent(content: ChatCompletionMessageParam["content"]) {
  if (typeof content === "string") {
    return content;
  }

  if (!Array.isArray(content)) {
    return "";
  }

  return content
    .map((part) => {
      if (typeof part === "string") {
        return part;
      }

      if ("text" in part && typeof part.text === "string") {
        return part.text;
      }

      return "";
    })
    .join("\n");
}

export function inferProviderFromModel(model?: string | null): MemberAiChatType {
  const value = (model ?? "").toLowerCase();

  if (value.includes("gemini")) {
    return "gemini";
  }

  if (value.includes("claude")) {
    return "claude";
  }

  return "gpt";
}

function getEnvApiKey(provider: MemberAiChatType) {
  switch (provider) {
    case "gemini":
      return process.env.GOOGLE_GEMINI_API_KEY ?? "";
    case "claude":
      return process.env.ANTHROPIC_API_KEY ?? "";
    case "gpt":
    default:
      return process.env.OPENAI_API_KEY ?? "";
  }
}

function getEnvModel(provider: MemberAiChatType, requestedModel?: string | null) {
  if (requestedModel?.trim()) {
    return requestedModel.trim();
  }

  switch (provider) {
    case "gemini":
      return process.env.GOOGLE_GEMINI_MODEL ?? getDefaultChatModel("gemini");
    case "claude":
      return process.env.ANTHROPIC_MODEL ?? getDefaultChatModel("claude");
    case "gpt":
    default:
      return process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  }
}

export async function resolveChatConfig(userId: string | null | undefined, requestedModel?: string | null) {
  if (userId) {
    const profile = await getMemberProfileById(userId);

    if (profile) {
      if (profile.aiEnabled === false) {
        throw new Error(`AI chat is disabled for this account. userId=${userId}`);
      }
      console.log("[chatbot llm] profile  ====================> ", profile);
      const apiKey = profile.apiKey.trim();
      if (!apiKey) {
        throw new Error(
          `No API key is configured in member profile. userId=${userId} provider=${profile.aiChatType} model=${profile.chatModel || getDefaultChatModel(profile.aiChatType)}`,
        );
      }

      return {
        provider: profile.aiChatType,
        model: profile.chatModel || getDefaultChatModel(profile.aiChatType),
        apiKey,
        source: "member" as const,
      };
    }
  }

  if (userId) {
    console.warn("[chatbot llm] member profile not found, using env fallback", {
      userId,
      requestedModel: requestedModel ?? null,
    });
  }

  const provider = inferProviderFromModel(requestedModel);
  const apiKey = getEnvApiKey(provider).trim();
  if (!apiKey) {
    throw new Error(
      `Missing ${provider} API key. userId=${userId ?? "anonymous"} requestedModel=${requestedModel ?? ""} source=env`,
    );
  }

  return {
    provider,
    model: getEnvModel(provider, requestedModel),
    apiKey,
    source: "env" as const,
  };
}

export function splitSystemMessage(messages: ChatCompletionMessageParam[]) {
  const plainMessages = messages.map((message) => ({
    role: message.role,
    content: stringifyContent(message.content),
  }));

  const systemPrompt = plainMessages
    .filter((message) => message.role === "system")
    .map((message) => message.content)
    .filter(Boolean)
    .join("\n\n")
    .trim();

  const conversation = plainMessages.filter((message) => message.role !== "system" && message.content.trim());
  return { systemPrompt, conversation };
}
