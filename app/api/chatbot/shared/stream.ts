import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

import type { ResolvedChatConfig } from "./provider";
import { splitSystemMessage } from "./provider";

const DEFAULT_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

function createAccumulatedStream(baseStream: ReadableStream<Uint8Array>) {
  const [accStream, clientStream] = baseStream.tee();

  (async () => {
    const decoder = new TextDecoder();
    const reader = accStream.getReader();
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }
        decoder.decode(value, { stream: true });
      }
    } catch (error) {
      console.error("[accumulate error]", error);
    } finally {
      reader.releaseLock();
    }
  })();

  return clientStream;
}

function streamOpenAIChat(
  messages: ChatCompletionMessageParam[],
  model: string,
  apiKey: string,
) {
  const openai = new OpenAI({ apiKey });
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const completion = await openai.chat.completions.create({
          model,
          messages,
          stream: true,
        });

        for await (const part of completion) {
          const delta = part.choices?.[0]?.delta?.content ?? "";
          if (delta) {
            controller.enqueue(encoder.encode(delta));
          }
        }

        controller.close();
      } catch (error) {
        controller.enqueue(encoder.encode("\n\n[stream-error] backend exception occurred. See server logs."));
        controller.close();
        console.error("[STREAM ERROR]", error);
      }
    },
  });
}

async function geminiStreamChat(
  allMessages: ChatCompletionMessageParam[],
  model: string,
  apiKey: string,
) {
  const { systemPrompt, conversation } = splitSystemMessage(allMessages);
  const encoder = new TextEncoder();
  const upstream = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse&key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(systemPrompt ? { systemInstruction: { parts: [{ text: systemPrompt }] } } : {}),
        contents: conversation.map((message) => ({
          role: message.role === "assistant" ? "model" : "user",
          parts: [{ text: message.content }],
        })),
      }),
    },
  );

  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text().catch(() => "");
    throw new Error(`[gemini-upstream-error] ${text}`);
  }

  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      let pending = "";

      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) {
            break;
          }

          pending += decoder.decode(value, { stream: true });
          const lines = pending.split("\n");
          pending = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) {
              continue;
            }

            const payloadText = trimmed.slice(5).trim();
            if (!payloadText || payloadText === "[DONE]") {
              continue;
            }

            const payload = JSON.parse(payloadText) as {
              candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
            };

            const text = payload.candidates?.[0]?.content?.parts
              ?.map((part) => part.text ?? "")
              .join("") ?? "";

            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
        }

        controller.close();
      } catch (error) {
        console.error("[gemini-stream-error]", error);
        controller.error(error);
      } finally {
        reader.releaseLock();
      }
    },
  });
}

async function claudeStreamChat(
  allMessages: ChatCompletionMessageParam[],
  model: string,
  apiKey: string,
) {
  const { systemPrompt, conversation } = splitSystemMessage(allMessages);
  const encoder = new TextEncoder();
  const upstream = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 2048,
      stream: true,
      ...(systemPrompt ? { system: systemPrompt } : {}),
      messages: conversation.map((message) => ({
        role: message.role === "assistant" ? "assistant" : "user",
        content: message.content,
      })),
    }),
  });

  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text().catch(() => "");
    throw new Error(`[claude-upstream-error] ${text}`);
  }

  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      let pending = "";
      let currentEvent = "";

      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) {
            break;
          }

          pending += decoder.decode(value, { stream: true });
          const lines = pending.split("\n");
          pending = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();

            if (!trimmed) {
              currentEvent = "";
              continue;
            }

            if (trimmed.startsWith("event:")) {
              currentEvent = trimmed.slice(6).trim();
              continue;
            }

            if (!trimmed.startsWith("data:")) {
              continue;
            }

            const payloadText = trimmed.slice(5).trim();
            if (!payloadText || payloadText === "[DONE]") {
              continue;
            }

            const payload = JSON.parse(payloadText) as {
              type?: string;
              delta?: { text?: string };
            };

            if (currentEvent === "content_block_delta" || payload.type === "content_block_delta") {
              const text = payload.delta?.text ?? "";
              if (text) {
                controller.enqueue(encoder.encode(text));
              }
            }
          }
        }

        controller.close();
      } catch (error) {
        console.error("[claude-stream-error]", error);
        controller.error(error);
      } finally {
        reader.releaseLock();
      }
    },
  });
}

export async function providerStreamChat(
  allMessages: ChatCompletionMessageParam[],
  config: ResolvedChatConfig,
) {
  switch (config.provider) {
    case "gemini":
      return geminiStreamChat(allMessages, config.model, config.apiKey);
    case "claude":
      return claudeStreamChat(allMessages, config.model, config.apiKey);
    case "gpt":
    default:
      return createAccumulatedStream(
        streamOpenAIChat(allMessages, config.model ?? DEFAULT_MODEL, config.apiKey),
      );
  }
}
