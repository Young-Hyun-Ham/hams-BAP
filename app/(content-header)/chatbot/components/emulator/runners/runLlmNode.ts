import type { AnyNode, ChatStep } from "../../../types";
import { makeStepId, resolveTemplate } from "../../../utils";

export async function runLlmNode(
  node: AnyNode,
  slotSnapshot: Record<string, any>,
  deps: {
    systemPrompt: string;
    model?: string | null;
    pushBotStep: (id: string, text: string) => void;
    setSteps: React.Dispatch<React.SetStateAction<ChatStep[]>>;
    setSlotValues: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  },
) {
  const { systemPrompt, model, pushBotStep, setSteps, setSlotValues } = deps;

  try {
    const rawPrompt: string = node.data?.prompt ?? "";
    const prompt = resolveTemplate(rawPrompt, slotSnapshot);
    const outputVar: string = node.data?.outputVar || "llm_output";

    const res = await fetch("/api/chatbot/llm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, systemPrompt, model }),
    });

    if (!res.ok || !res.body) {
      const message = (await res.text().catch(() => "")).trim();
      pushBotStep(makeStepId(`${node.id}-err`), `[LLM 오류] ${message || `상태 코드: ${res.status}`}`);
      return false;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");

    const stepId = makeStepId(node.id);
    let accumulated = "";

    setSteps((prev) => [...prev, { id: stepId, role: "bot", text: "" }]);

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (!value) continue;

      const chunkText = decoder.decode(value, { stream: true });
      if (!chunkText) continue;

      accumulated += chunkText;

      setSteps((prev) => prev.map((step) => (step.id === stepId ? { ...step, text: accumulated } : step)));
    }

    setSlotValues((prev) => ({ ...prev, [outputVar]: accumulated }));
    return true;
  } catch (error) {
    console.error("LLM node execution error:", error);
    pushBotStep(makeStepId(`${node.id}-err`), "[LLM 실행 오류가 발생했습니다.]");
    return false;
  }
}
