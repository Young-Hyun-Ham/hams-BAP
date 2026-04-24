import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { NextRequest } from "next/server";

import { requireUserId } from "@/app/api/chatbot/shared/authServer";
import { resolveChatConfig } from "@/app/api/chatbot/shared/provider";
import { providerStreamChat } from "@/app/api/chatbot/shared/stream";

export async function POST(req: NextRequest) {
  try {
    const { prompt, systemPrompt, model } = await req.json();
    const userId = await requireUserId(req).catch(() => null);

    const messages: ChatCompletionMessageParam[] = [
      ...(systemPrompt ? [{ role: "system", content: systemPrompt } satisfies ChatCompletionMessageParam] : []),
      { role: "user", content: prompt ?? "" },
    ];

    const config = await resolveChatConfig(userId, model);
    console.log("[chatbot llm] resolved config", {
      userId,
      requestedModel: model ?? null,
      provider: config.provider,
      model: config.model,
      source: config.source,
    });

    const stream = await providerStreamChat(messages, config);

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown chatbot llm error";
    console.error("[chatbot llm] request failed", error);
    return new Response(message, {
      status: 500,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }
}
