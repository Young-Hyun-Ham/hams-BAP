import { useCallback, useRef } from "react";

import useBuilderStore from "../../../store/index";
import {
  builderExecutionStore,
  type ExecutionLog,
  type ExecutionPhase,
} from "../../../store/builderExecutionStore";
import {
  evaluateCondition,
  getNestedValue,
  interpolateMessage,
} from "../../../utils/simulatorUtils";
import { GOOGLE_GEMINI_API_KEY } from "@/lib/gemini";

type BuilderNode = {
  id: string;
  type: string;
  data?: any;
  parentNode?: string;
};

type BuilderEdge = {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
};

type UseBuilderExecutionArgs = {
  nodes: BuilderNode[];
  edges: BuilderEdge[];
};

type RunNodeResult = {
  slots: Record<string, unknown>;
  nextNode: BuilderNode | null;
  payload?: any;
  waitForUser?: boolean;
  waitMessage?: string;
};

const now = () => new Date().toISOString();

const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

export function useBuilderExecution({
  nodes,
  edges,
}: UseBuilderExecutionArgs) {
  const startNodeId = useBuilderStore((state: any) => state.startNodeId);
  const anchorNodeId = useBuilderStore((state: any) => state.anchorNodeId);
  const slots = useBuilderStore((state: any) => state.slots);
  const setSlots = useBuilderStore((state: any) => state.setSlots);

  const openBranchSelection = builderExecutionStore(
    (state) => state.openBranchSelection
  );
  const closeBranchSelection = builderExecutionStore(
    (state) => state.closeBranchSelection
  );

  const pendingBranchNodeRef = useRef<BuilderNode | null>(null);

  const branchSelectionResolverRef = useRef<
    ((reply: { display: string; value: string } | null) => void) | null
  >(null);

  // 선택 대기 함수
  const requestBranchSelection = useCallback(
    (node: BuilderNode, replies: Array<{ display: string; value: string }>) => {
      return new Promise<{ display: string; value: string } | null>((resolve) => {
        pendingBranchNodeRef.current = node;
        branchSelectionResolverRef.current = resolve;

        openBranchSelection({
          nodeId: node.id,
          nodeType: node.type,
          title: node.data?.content ?? "분기 선택",
          replies,
        });
      });
    },
    [openBranchSelection]
  );

  const selectBranchReply = useCallback((replyValue: string) => {
    const node = pendingBranchNodeRef.current;
    if (!node) return;

    const replies = node.data?.replies ?? [];
    const selectedReply = replies.find((r: any) => r?.value === replyValue) ?? null;

    const resolve = branchSelectionResolverRef.current;
    branchSelectionResolverRef.current = null;
    pendingBranchNodeRef.current = null;
    closeBranchSelection();

    resolve?.(selectedReply);
  }, [closeBranchSelection]);

  const cancelBranchReplySelection = useCallback(() => {
    const resolve = branchSelectionResolverRef.current;
    branchSelectionResolverRef.current = null;
    pendingBranchNodeRef.current = null;
    closeBranchSelection();

    resolve?.(null);
  }, [closeBranchSelection]);


  const executionRunning = builderExecutionStore(
    (state) => state.executionRunning
  );
  const resetExecution = builderExecutionStore(
    (state) => state.resetExecution
  );
  const startExecution = builderExecutionStore(
    (state) => state.startExecution
  );
  const setExecutionCurrentNode = builderExecutionStore(
    (state) => state.setExecutionCurrentNode
  );
  const markExecutionCompleted = builderExecutionStore(
    (state) => state.markExecutionCompleted
  );
  const appendExecutionLog = builderExecutionStore(
    (state) => state.appendExecutionLog
  );
  const finishExecution = builderExecutionStore(
    (state) => state.finishExecution
  );
  const failExecution = builderExecutionStore((state) => state.failExecution);
  const cancelExecution = builderExecutionStore(
    (state) => state.cancelExecution
  );

  const cancelRef = useRef(false);
  const inFlightRef = useRef(false);

  const log = useCallback(
    (phase: ExecutionPhase, meta: Partial<ExecutionLog> = {}) => {
      const entry: ExecutionLog = {
        at: now(),
        phase,
        ...meta,
      };

      appendExecutionLog(entry);

      if (phase === "error") {
        console.error("[builder-execution]", entry);
      } else {
        // console.log("[builder-execution]", entry);
      }
    },
    [appendExecutionLog]
  );

  const assertNotCanceled = useCallback(() => {
    if (cancelRef.current) {
      throw new Error("Execution canceled by user.");
    }
  }, []);

  const getNodeById = useCallback(
    (nodeId: string | null | undefined) => {
      if (!nodeId) return null;
      return nodes.find((node) => node.id === nodeId) ?? null;
    },
    [nodes]
  );

  const findNextNode = useCallback(
    (sourceNodeId: string, sourceHandle?: string | null) => {
      let nextEdge: BuilderEdge | undefined;

      if (sourceHandle) {
        nextEdge = edges.find(
          (edge) =>
            edge.source === sourceNodeId &&
            edge.sourceHandle === sourceHandle
        );
      }

      if (!nextEdge) {
        nextEdge =
          edges.find(
            (edge) =>
              edge.source === sourceNodeId &&
              edge.sourceHandle === "default"
          ) ||
          edges.find(
            (edge) =>
              edge.source === sourceNodeId &&
              (edge.sourceHandle == null || edge.sourceHandle === "")
          );
      }

      if (!nextEdge) return null;
      return getNodeById(nextEdge.target);
    },
    [edges, getNodeById]
  );

  const getChildNodes = useCallback(
    (parentNodeId: string) =>
      nodes.filter((node) => node.parentNode === parentNodeId),
    [nodes]
  );

  const findGroupEntryNode = useCallback(
    (groupNode: BuilderNode) => {
      const childNodes = getChildNodes(groupNode.id);
      if (childNodes.length === 0) return null;

      if (
        groupNode.type === "selectionGroup" &&
        groupNode.data?.entryNodeId
      ) {
        const explicit = childNodes.find(
          (node) => node.id === groupNode.data.entryNodeId
        );
        if (explicit) return explicit;
      }

      const childIds = new Set(childNodes.map((node) => node.id));

      return (
        childNodes.find(
          (node) =>
            !edges.some(
              (edge) =>
                edge.target === node.id && childIds.has(edge.source)
            )
        ) ?? null
      );
    },
    [edges, getChildNodes]
  );

  const resolveBranchHandle = useCallback(
    (node: BuilderNode, currentSlots: Record<string, unknown>) => {
      const conditions = node.data?.conditions ?? [];
      const replies = node.data?.replies ?? [];

      for (let i = 0; i < conditions.length; i += 1) {
        const condition = conditions[i];
        const reply = replies[i];
        if (!condition || !reply?.value) continue;

        const slotValue = getNestedValue(currentSlots, condition.slot);
        const matched = evaluateCondition(
          slotValue,
          condition.operator,
          condition,
          currentSlots
        );

        if (matched) {
          return reply.value;
        }
      }

      return "default";
    },
    []
  );

  const applySetSlotAssignments = useCallback(
    (node: BuilderNode, currentSlots: Record<string, unknown>) => {
      const nextSlots = { ...currentSlots };
      const assignments = node.data?.assignments ?? [];

      assignments.forEach((assignment: any) => {
        if (!assignment?.key) return;

        const interpolated = interpolateMessage(
          assignment.value ?? "",
          nextSlots
        );

        const text = String(interpolated ?? "").trim();

        try {
          if (
            (text.startsWith("{") && text.endsWith("}")) ||
            (text.startsWith("[") && text.endsWith("]"))
          ) {
            nextSlots[assignment.key] = JSON.parse(text);
            return;
          }
        } catch {
          // fall through
        }

        if (text.toLowerCase() === "true") {
          nextSlots[assignment.key] = true;
          return;
        }

        if (text.toLowerCase() === "false") {
          nextSlots[assignment.key] = false;
          return;
        }

        if (text !== "" && !Number.isNaN(Number(text))) {
          nextSlots[assignment.key] = Number(text);
          return;
        }

        nextSlots[assignment.key] = interpolated;
      });

      return nextSlots;
    },
    []
  );

  const executeApiNode = useCallback(
    async (
      node: BuilderNode,
      currentSlots: Record<string, unknown>
    ): Promise<RunNodeResult> => {
      const isMulti = Boolean(node.data?.isMulti);
      const apiCalls = isMulti ? node.data?.apis ?? [] : [node.data];

      const processApiCall = async (apiCall: any) => {
        const method = String(apiCall?.method ?? "GET").toUpperCase();
        const url = interpolateMessage(apiCall?.url ?? "", currentSlots);

        let headers: Record<string, string> = {};
        try {
          headers = JSON.parse(
            interpolateMessage(apiCall?.headers ?? "{}", currentSlots)
          );
        } catch {
          headers = {};
        }

        const init: RequestInit = {
          method,
          headers: {
            "Content-Type": "application/json",
            ...headers,
          },
        };

        if (method === "GET" || method === "HEAD") {
          delete (init.headers as Record<string, string>)["Content-Type"];
        } else {
          const body = interpolateMessage(apiCall?.body ?? "{}", currentSlots);
          init.body = body;
        }

        const response = await fetch(url, init);
        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            `API call failed (${response.status}) ${response.statusText}`
          );
        }

        return {
          data,
          mapping: apiCall?.responseMapping ?? [],
          name: apiCall?.name ?? "api",
        };
      };

      try {
        const results = await Promise.all(apiCalls.map(processApiCall));
        const nextSlots = { ...currentSlots };

        results.forEach((result) => {
          (result.mapping ?? []).forEach((mapping: any) => {
            if (!mapping?.path || !mapping?.slot) return;
            const value = getNestedValue(result.data, mapping.path);
            if (value !== undefined) {
              nextSlots[mapping.slot] = value;
            }
          });
        });

        setSlots(nextSlots);

        return {
          slots: nextSlots,
          nextNode: findNextNode(node.id, "onSuccess"),
          payload: {
            status: "success",
            apiCount: results.length,
            results,
          },
        };
      } catch (error: any) {
        const errorNextNode = findNextNode(node.id, "onError");

        if (!errorNextNode) {
          throw new Error(
            error?.message || "API request failed and no onError edge is connected."
          );
        }

        return {
          slots: currentSlots,
          nextNode: errorNextNode,
          payload: {
            status: "error",
            message: error?.message || "API request failed",
            method: node.data?.method ?? null,
            url: node.data?.url ?? null,
          },
        };
      }
    },
    [findNextNode, setSlots]
  );

  const executeLlmNode = useCallback(
    async (
      node: BuilderNode,
      currentSlots: Record<string, unknown>
    ): Promise<RunNodeResult> => {
      if (!GOOGLE_GEMINI_API_KEY) {
        throw new Error("GOOGLE_GEMINI_API_KEY is not set.");
      }

      const prompt = interpolateMessage(node.data?.prompt ?? "", currentSlots);
      const apiUrl =
        `https://generativelanguage.googleapis.com/v1beta/models/` +
        `gemini-2.0-flash:streamGenerateContent?key=${GOOGLE_GEMINI_API_KEY}&alt=sse`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      });

      if (!response.ok) {
        const errorBody = await response
          .json()
          .catch(() => ({ error: { message: response.statusText } }));
        throw new Error(
          `LLM API Error ${response.status}: ${
            errorBody?.error?.message || "Unknown error"
          }`
        );
      }

      if (!response.body) {
        throw new Error("ReadableStream not available.");
      }

      const reader = response.body
        .pipeThrough(new TextDecoderStream())
        .getReader();

      let buffer = "";
      let accumulated = "";

      while (true) {
        assertNotCanceled();

        const { value, done } = await reader.read();
        if (value) buffer += value;

        let boundaryIndex = -1;
        while ((boundaryIndex = buffer.search(/\r?\n\r?\n/)) !== -1) {
          const message = buffer.substring(0, boundaryIndex);
          const boundaryLength = buffer
            .substring(boundaryIndex)
            .startsWith("\r\n\r\n")
            ? 4
            : 2;

          buffer = buffer.substring(boundaryIndex + boundaryLength);

          if (!message.startsWith("data: ")) continue;

          const jsonString = message.substring(6).replace(/\r/g, "").trim();
          if (!jsonString) continue;

          try {
            const json = JSON.parse(jsonString);
            const chunk =
              json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
            if (chunk) accumulated += chunk;
          } catch {
            // ignore malformed chunks
          }
        }

        if (done) break;
      }

      const nextSlots = { ...currentSlots };
      if (node.data?.outputVar) {
        nextSlots[node.data.outputVar] = accumulated;
        setSlots(nextSlots);
      }

      return {
        slots: nextSlots,
        nextNode: findNextNode(node.id, null),
        payload: {
          output: accumulated,
          outputVar: node.data?.outputVar ?? null,
        },
      };
    },
    [assertNotCanceled, findNextNode, setSlots]
  );

  const runNode = useCallback(
    async (
      node: BuilderNode,
      currentSlots: Record<string, unknown>
    ): Promise<RunNodeResult> => {
      assertNotCanceled();

      switch (node.type) {
        case "message":
          return {
            slots: currentSlots,
            nextNode: findNextNode(node.id, null),
            payload: {
              content: interpolateMessage(node.data?.content ?? "", currentSlots),
            },
          };

        case "setSlot": {
          const nextSlots = applySetSlotAssignments(node, currentSlots);
          setSlots(nextSlots);

          return {
            slots: nextSlots,
            nextNode: findNextNode(node.id, null),
            payload: {
              assignments: node.data?.assignments ?? [],
            },
          };
        }

        case "delay": {
          const duration = Number(node.data?.duration ?? 0);
          await wait(duration);

          return {
            slots: currentSlots,
            nextNode: findNextNode(node.id, null),
            payload: {
              duration,
            },
          };
        }

        case "toast":
          return {
            slots: currentSlots,
            nextNode: findNextNode(node.id, null),
            payload: {
              toastType: node.data?.toastType ?? "info",
              message: interpolateMessage(node.data?.message ?? "", currentSlots),
            },
          };

        case "link":
          return {
            slots: currentSlots,
            nextNode: findNextNode(node.id, null),
            payload: {
              display: interpolateMessage(node.data?.display ?? "", currentSlots),
              url: interpolateMessage(node.data?.content ?? "", currentSlots),
            },
          };

        case "iframe":
          return {
            slots: currentSlots,
            nextNode: findNextNode(node.id, null),
            payload: {
              url: interpolateMessage(node.data?.url ?? "", currentSlots),
              width: node.data?.width ?? null,
              height: node.data?.height ?? null,
            },
          };

        case "branch": {
          if (node.data?.evaluationType === "CONDITION") {
            const handle = resolveBranchHandle(node, currentSlots);
            return {
              slots: currentSlots,
              nextNode: findNextNode(node.id, handle),
              payload: {
                selectedHandle: handle,
                evaluationType: "CONDITION",
              },
            };
          }

          const replies = (node.data?.replies ?? []).filter((r: any) => r?.value);

          if (!replies.length) {
            return {
              slots: currentSlots,
              nextNode: null,
              waitForUser: true,
              waitMessage: "Branch node has no selectable reply.",
              payload: {
                evaluationType: "BUTTON",
              },
            };
          }

          log("wait", {
            nodeId: node.id,
            nodeType: node.type,
            message: "Waiting for branch selection.",
            payload: {
              evaluationType: "BUTTON",
              replies,
            },
          });

          const selectedReply = await requestBranchSelection(node, replies);

          if (!selectedReply?.value) {
            throw new Error("Branch selection was canceled.");
          }

          return {
            slots: currentSlots,
            nextNode: findNextNode(node.id, selectedReply.value),
            payload: {
              evaluationType: "BUTTON",
              selectedReply,
            },
          };
        }

        case "form":
        case "slotfilling":
        case "fixedmenu":
          return {
            slots: currentSlots,
            nextNode: null,
            waitForUser: true,
            waitMessage: `Interactive node '${node.type}' requires manual input.`,
          };

        case "scenario":
        case "selectionGroup": {
          const entryNode = findGroupEntryNode(node);
          return {
            slots: currentSlots,
            nextNode: entryNode ?? findNextNode(node.id, null),
            payload: {
              entryNodeId: entryNode?.id ?? null,
            },
          };
        }

        case "api":
          return executeApiNode(node, currentSlots);

        case "llm":
          return executeLlmNode(node, currentSlots);

        default:
          return {
            slots: currentSlots,
            nextNode: findNextNode(node.id, null),
            payload: {
              message: `No specific executor for node type '${node.type}'.`,
            },
          };
      }
    },
    [
      applySetSlotAssignments,
      assertNotCanceled,
      executeApiNode,
      executeLlmNode,
      findGroupEntryNode,
      findNextNode,
      resolveBranchHandle,
      setSlots,
    ]
  );

  const stopExecution = useCallback(() => {
    cancelRef.current = true;
    inFlightRef.current = false;
    cancelExecution("Stopped by user.");
  }, [cancelExecution]);

  const runBetweenStartAndAnchor = useCallback(async () => {
    if (inFlightRef.current) return;

    if (!startNodeId) {
      failExecution("startNodeId is not set.");
      alert("startNodeId is not set.");
      return;
    }

    if (!anchorNodeId) {
      failExecution("anchorNodeId is not set.");
      alert("anchorNodeId is not set.");
      return;
    }

    const startNode = getNodeById(startNodeId);
    if (!startNode) {
      failExecution(`Start node not found: ${startNodeId}`);
      return;
    }

    cancelRef.current = false;
    inFlightRef.current = true;

    // 이전 실행 했던 slot 유지
    // resetExecution();
    // startExecution({ startNodeId, anchorNodeId });

    // let currentNode: BuilderNode | null = startNode;
    // let currentSlots: Record<string, unknown> = {
    //   ...(slots ?? {}),
    // };

    resetExecution();
    setSlots({}); // 플레이 시작 시 slot 초기화
    startExecution({ startNodeId, anchorNodeId });

    let currentNode: BuilderNode | null = startNode;
    let currentSlots: Record<string, unknown> = {};

    const maxSteps = 300;
    let step = 0;

    try {
      while (currentNode && step < maxSteps) {
        assertNotCanceled();
        step += 1;

        setExecutionCurrentNode(currentNode.id, currentNode.type);

        await wait(currentNode.type === "delay" ? 0 : 1000);

        log("enter", {
          nodeId: currentNode.id,
          nodeType: currentNode.type,
          message: `Entering node ${currentNode.id}`,
          payload: {
            step,
            anchorNodeId,
            slotsSnapshot: currentSlots,
          },
        });

        // 모든 노드 공통 1초 로딩 표시
        // 단, delay 노드는 자체 duration이 있으니 중복 지연을 피하려면 0초 처리
        // const stepDelay = currentNode.type === "delay" ? 0 : 1000;
        // if (stepDelay > 0) {
        //   await wait(stepDelay);
        // }

        const result = await runNode(currentNode, currentSlots);
        currentSlots = result.slots ?? currentSlots;

        if (result.waitForUser) {
          log("wait", {
            nodeId: currentNode.id,
            nodeType: currentNode.type,
            message: result.waitMessage ?? "Execution is waiting for user input.",
            payload: result.payload,
          });

          cancelExecution(result.waitMessage ?? "Waiting for user input.");
          return;
        }

        markExecutionCompleted(currentNode.id, {
          nodeType: currentNode.type,
          payload: result.payload,
        });

        log("complete", {
          nodeId: currentNode.id,
          nodeType: currentNode.type,
          message: `Completed node ${currentNode.id}`,
          payload: result.payload,
        });

        if (currentNode.id === anchorNodeId) {
          finishExecution("Anchor node reached.");
          return;
        }

        currentNode = result.nextNode ?? null;
      }

      if (step >= maxSteps) {
        throw new Error("Execution stopped due to max step limit.");
      }

      finishExecution("Execution finished without reaching anchor.");
    } catch (error: any) {
      if (cancelRef.current) {
        cancelExecution(error?.message || "Execution canceled.");
        return;
      }

      failExecution(error?.message || "Unknown execution error.");
    } finally {
      setExecutionCurrentNode(null);
      inFlightRef.current = false;
    }
  }, [
    anchorNodeId,
    assertNotCanceled,
    cancelExecution,
    failExecution,
    finishExecution,
    getNodeById,
    log,
    markExecutionCompleted,
    resetExecution,
    runNode,
    setExecutionCurrentNode,
    startExecution,
    startNodeId,
    slots,
  ]);

  return {
    executionRunning,
    runBetweenStartAndAnchor,
    stopExecution,
    selectBranchReply,
    cancelBranchReplySelection,
  };
}
