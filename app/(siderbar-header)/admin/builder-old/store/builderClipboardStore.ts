import { create } from "zustand";
import type { Edge, Node } from "reactflow";

type ClipboardPayload = {
  nodes: Node<any>[];
  edges: Edge<any>[];
  copiedAt: string;
};

type CopyArgs = {
  nodes: Node<any>[];
  edges: Edge<any>[];
  selectedNodeIds: string[];
};

type CutArgs = CopyArgs & {
  deleteNodesByIds: (nodeIds: string[]) => void;
};

type PasteArgs = {
  nodes: Node<any>[];
  edges: Edge<any>[];
  setNodes: (nodes: Node<any>[]) => void;
  setEdges: (edges: Edge<any>[]) => void;
  pushHistory: () => void;
  pastePosition?: { x: number; y: number } | null;
};

type BuilderClipboardState = {
  clipboard: ClipboardPayload | null;
  copySelection: (args: CopyArgs) => void;
  cutSelection: (args: CutArgs) => void;
  pasteClipboard: (args: PasteArgs) => void;
  clearClipboard: () => void;
};

const deepCopy = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

const makeNodeId = (type: string, index: number) =>
  `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}-${index}`;

const makeEdgeId = (source: string, target: string, edge: Edge<any>) =>
  `reactflow__edge-${source}${edge.sourceHandle || ""}-${target}${edge.targetHandle || ""}`;

export const builderClipboardStore = create<BuilderClipboardState>((set, get) => ({
  clipboard: null,

  copySelection: ({ nodes, edges, selectedNodeIds }) => {
    if (!selectedNodeIds.length) return;

    const includedNodeIds = new Set<string>();
    const childrenByParent = new Map<string, Node<any>[]>();

    nodes.forEach((node) => {
      if (!node.parentNode) return;

      const siblings = childrenByParent.get(node.parentNode) ?? [];
      siblings.push(node);
      childrenByParent.set(node.parentNode, siblings);
    });

    const includeNodeTree = (nodeId: string) => {
      if (includedNodeIds.has(nodeId)) return;

      includedNodeIds.add(nodeId);

      const children = childrenByParent.get(nodeId) ?? [];
      children.forEach((child) => includeNodeTree(child.id));
    };

    selectedNodeIds.forEach(includeNodeTree);

    const selectedNodes = nodes.filter((node) => includedNodeIds.has(node.id));
    const selectedEdges = edges.filter(
      (edge) => includedNodeIds.has(edge.source) && includedNodeIds.has(edge.target)
    );

    set({
      clipboard: {
        nodes: deepCopy(selectedNodes),
        edges: deepCopy(selectedEdges),
        copiedAt: new Date().toISOString(),
      },
    });
  },

  cutSelection: ({ nodes, edges, selectedNodeIds, deleteNodesByIds }) => {
    get().copySelection({ nodes, edges, selectedNodeIds });
    deleteNodesByIds(selectedNodeIds);
  },

  pasteClipboard: ({ nodes, edges, setNodes, setEdges, pushHistory, pastePosition }) => {
    const clipboard = get().clipboard;
    if (!clipboard || clipboard.nodes.length === 0) return;

    pushHistory();

    const idMap = new Map<string, string>();
    const copiedNodeIdSet = new Set(clipboard.nodes.map((node) => node.id));

    const topLevelNodes = clipboard.nodes.filter(
      (node) => !node.parentNode || !copiedNodeIdSet.has(node.parentNode)
    );

    const minX = Math.min(...topLevelNodes.map((node) => node.position.x));
    const minY = Math.min(...topLevelNodes.map((node) => node.position.y));

    const baseOffset = pastePosition
      ? { x: pastePosition.x - minX, y: pastePosition.y - minY }
      : { x: 40, y: 40 };

    const pastedNodes: Node<any>[] = clipboard.nodes.map((node, index) => {
      const nextId = makeNodeId(node.type || "node", index);
      idMap.set(node.id, nextId);

      const isChildOfCopiedParent =
        !!node.parentNode && copiedNodeIdSet.has(node.parentNode);

      return {
        ...deepCopy(node),
        id: nextId,
        position: isChildOfCopiedParent
          ? { ...node.position }
          : {
              x: node.position.x + baseOffset.x,
              y: node.position.y + baseOffset.y,
            },
        selected: false,
      };
    });

    const normalizedNodes: Node<any>[] = pastedNodes.map((node, index) => {
      const originalNode = clipboard.nodes[index];
      const originalParentId = originalNode.parentNode;

      if (!originalParentId || !idMap.has(originalParentId)) {
        const nextNode = { ...node };
        delete nextNode.parentNode;
        delete nextNode.extent;
        return nextNode;
      }

      return {
        ...node,
        parentNode: idMap.get(originalParentId),
        extent: originalNode.extent,
      };
    });

    const pastedEdges = clipboard.edges
      .map((edge) => {
        const source = idMap.get(edge.source);
        const target = idMap.get(edge.target);
        if (!source || !target) return null;

        const nextData = deepCopy(edge.data ?? {});

        if (Array.isArray(nextData.points)) {
          nextData.points = nextData.points.map((point: { x: number; y: number }) => ({
            x: point.x + baseOffset.x,
            y: point.y + baseOffset.y,
          }));
        }

        if (typeof nextData.controlX === "number") {
          nextData.controlX += baseOffset.x;
        }

        if (typeof nextData.controlY === "number") {
          nextData.controlY += baseOffset.y;
        }

        return {
          ...deepCopy(edge),
          id: makeEdgeId(source, target, edge),
          source,
          target,
          data: nextData,
          selected: false,
        };
      })
      .filter(Boolean) as Edge<any>[];

    setNodes([...nodes, ...normalizedNodes]);
    setEdges([...edges, ...pastedEdges]);

    get().clearClipboard();
  },

  clearClipboard: () => set({ clipboard: null }),
}));
