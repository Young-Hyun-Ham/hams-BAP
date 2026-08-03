import { useCallback, useMemo, useState } from 'react';

import type { BuilderNode } from '../../types';

const getAbsoluteNodePosition = (node: any, allNodes: any[]) => {
  let x = node.position.x;
  let y = node.position.y;
  let current = node;

  while (current.parentNode) {
    const parent = allNodes.find((n: any) => n.id === current.parentNode);
    if (!parent) break;
    x += parent.position.x;
    y += parent.position.y;
    current = parent;
  }

  return { x, y };
};

export function useFlowNodeSearch({
  nodes,
  setNodes,
  setSelectedNodeId,
  setCenter,
}: {
  nodes: BuilderNode[];
  setNodes: (nodes: BuilderNode[]) => void;
  setSelectedNodeId: (nodeId: string | null) => void;
  setCenter: (
    x: number,
    y: number,
    options?: { zoom?: number; duration?: number },
  ) => void;
}) {
  const [searchType, setSearchType] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState('');

  const getNodeSearchText = useCallback((node: any) => {
    const data = node?.data ?? {};

    switch (node.type) {
      case 'message':
        return [data.content];
      case 'form':
        return [data.title];
      case 'slotfilling':
        return [data.content, data.slot];
      case 'api':
        return [
          data.url,
          ...(Array.isArray(data.apis)
            ? data.apis.map((api: any) => api?.name)
            : []),
        ];
      case 'branch':
        return Array.isArray(data.replies)
          ? data.replies.map((reply: any) => reply?.display)
          : [];
      case 'link':
        return [data.display, data.content];
      case 'llm':
        return [data.prompt];
      case 'toast':
        return [data.message];
      case 'iframe':
        return [data.url];
      case 'scenario':
        return [data.label];
      case 'selectionGroup':
        return [data.label, data.title];
      case 'setSlot':
        return Array.isArray(data.assignments)
          ? data.assignments.flatMap((item: any) => [item?.key, item?.value])
          : [];
      case 'delay':
        return [String(data.duration ?? '')];
      default:
        return [];
    }
  }, []);

  const filteredSearchResults = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();
    if (!keyword) return [];

    return nodes.filter((node: any) => {
      const typeMatched = searchType === 'all' || node.type === searchType;
      if (!typeMatched) return false;

      const text = getNodeSearchText(node)
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return text.includes(keyword);
    });
  }, [nodes, searchType, searchKeyword, getNodeSearchText]);

  const focusNode = useCallback(
    (targetNode: any) => {
      if (!targetNode) return;

      setSelectedNodeId(targetNode.id);
      setNodes(
        nodes.map((node: any) => ({
          ...node,
          selected: node.id === targetNode.id,
        })),
      );

      const abs = getAbsoluteNodePosition(targetNode, nodes);
      const width = Number(targetNode.width ?? targetNode.style?.width ?? 250);
      const height = Number(
        targetNode.height ?? targetNode.style?.height ?? 150,
      );

      setCenter(abs.x + width / 2, abs.y + height / 2, {
        zoom: 1.1,
        duration: 500,
      });
    },
    [nodes, setCenter, setNodes, setSelectedNodeId],
  );

  return {
    searchType,
    setSearchType,
    searchKeyword,
    setSearchKeyword,
    getNodeSearchText,
    filteredSearchResults,
    focusNode,
  };
}
