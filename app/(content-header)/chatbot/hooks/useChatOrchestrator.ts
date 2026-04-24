"use client";

import { useCallback } from "react";

import type { ChatMessage } from "../types";
import { sleep } from "../utils";
import { fetchKnowledgeAnswer, getGeminiPrefix } from "../utils/knowledge";
import { readMixedTextStream } from "../utils/streamText";

type PatchMessage = (sessionId: string, messageId: string, fn: (prev: ChatMessage) => ChatMessage) => void;

export function useChatOrchestrator(opts: {
  systemPrompt: string;
  model?: string | null;
  textareaFocus: () => void;
  ensureSession: () => string;
  addMessage: (message: ChatMessage) => void;
  patchMessage: PatchMessage;
  onScenarioSuggest: (args: { sessionId: string; assistantId: string; ans: any }) => void;
}) {
  const {
    systemPrompt,
    model,
    textareaFocus,
    ensureSession,
    addMessage,
    patchMessage,
    onScenarioSuggest,
  } = opts;

  const send = useCallback(async (text: string) => {
    const sessionId = ensureSession();

    const now = Date.now();
    const userMessage: ChatMessage = {
      id: `user-${now}`,
      role: "user",
      content: text,
      createdAt: new Date(now).toISOString(),
    };
    addMessage(userMessage);

    const assistantId = `assistant-${now + 1}`;
    addMessage({
      id: assistantId,
      role: "assistant",
      content: "",
      createdAt: new Date(now + 1).toISOString(),
    });

    let showFallbackLoading = false;
    let fallbackPrefix = "";

    let shouldCallLlm = true;
    try {
      const ans = await fetchKnowledgeAnswer({ text, systemPrompt, mode: "plan", locale: "ko" });

      if (ans?.answer) {
        patchMessage(sessionId, assistantId, (prev) => ({
          ...prev,
          kind: "llm",
          content: ans.answer,
          meta: { ...(prev as any)?.meta, loading: false },
        }));
        textareaFocus();
        return;
      }

      const scenarioKey = String(ans?.scenario?.scenarioKey ?? "");
      const hasScenario = Boolean(scenarioKey);

      if (hasScenario && ans?.shouldCallGemini === false) {
        onScenarioSuggest({ sessionId, assistantId, ans });
        textareaFocus();
        return;
      }

      shouldCallLlm = Boolean(ans?.shouldCallGemini);
      if (!shouldCallLlm) {
        shouldCallLlm = true;
      }

      showFallbackLoading = true;
      fallbackPrefix = getGeminiPrefix(ans) || "일반 응답으로 진행합니다.\n\n";

      patchMessage(sessionId, assistantId, (prev: any) => ({
        ...prev,
        kind: "llm",
        content: fallbackPrefix,
        meta: { ...(prev?.meta ?? {}), loading: true },
      }));
    } catch {
      shouldCallLlm = true;
    }

    if (!shouldCallLlm) {
      textareaFocus();
      return;
    }

    try {
      const res = await fetch("/api/chatbot/llm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text, systemPrompt, model }),
      });

      if (!res.ok) {
        const message = (await res.text().catch(() => "")).trim();
        throw new Error(message || `LLM HTTP ${res.status}`);
      }

      if (showFallbackLoading) {
        await sleep(200);
      }

      let started = false;
      await readMixedTextStream(res, (delta) => {
        if (!delta) {
          return;
        }

        if (!started) {
          started = true;
          if (showFallbackLoading) {
            patchMessage(sessionId, assistantId, (prev: any) => ({
              ...prev,
              kind: "llm",
              content: `${fallbackPrefix ?? ""}${delta}`,
              meta: { ...(prev?.meta ?? {}), loading: false },
            }));
            return;
          }
        }

        patchMessage(sessionId, assistantId, (prev) => ({
          ...prev,
          kind: "llm",
          content: `${prev.content ?? ""}${delta}`,
        }));
      });

      if (showFallbackLoading && !started) {
        patchMessage(sessionId, assistantId, (prev: any) => ({
          ...prev,
          meta: { ...(prev?.meta ?? {}), loading: false },
        }));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "AI 응답 중 오류가 발생했습니다.";
      patchMessage(sessionId, assistantId, (prev: any) => ({
        ...prev,
        meta: { ...(prev?.meta ?? {}), loading: false },
        content: message,
      }));
    } finally {
      if (showFallbackLoading) {
        patchMessage(sessionId, assistantId, (prev: any) => ({
          ...prev,
          meta: { ...(prev?.meta ?? {}), loading: false },
        }));
      }
      textareaFocus();
    }
  }, [systemPrompt, model, ensureSession, addMessage, patchMessage, onScenarioSuggest, textareaFocus]);

  return { send };
}
