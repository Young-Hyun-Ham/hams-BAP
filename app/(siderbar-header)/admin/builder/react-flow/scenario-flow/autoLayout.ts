import dagre from '@dagrejs/dagre';
import { Node, Edge } from '@xyflow/react';

export const getNodeDimensions = (node: any) => {
  if (node.type === 'ynBranch') {
    return { width: 30, height: 30 };
  }
  if (node.type === 'delay') {
    return { width: 36, height: 36 };
  }
  if (node.type === 'scenario') {
    const isCollapsed = node.data?.isCollapsed !== false;
    return { width: 450, height: isCollapsed ? 50 : 120 };
  }
  if (node.type === 'selectionGroup') {
    const isCollapsed = node.data?.isCollapsed !== false;
    return { width: 450, height: isCollapsed ? 50 : 120 };
  }
  const width = node.width || (node as any).measured?.width || 280;
  const height = node.height || (node as any).measured?.height || 160;
  return { width, height };
};

export const getHandleSide = (
  node: any,
  isSource: boolean,
  handleId?: string,
): 'left' | 'right' | 'top' | 'bottom' => {
  if (!node) return isSource ? 'right' : 'left';

  if (node.type === 'ynBranch') {
    if (isSource) {
      const hId = handleId === 'N' ? 'N' : 'Y';
      const posY = node.data?.outputPositions?.['Y'] || 'right';
      const posN = node.data?.outputPositions?.['N'] || 'bottom';
      return hId === 'Y' ? posY : posN;
    } else {
      return node.data?.inputPosition ?? 'left';
    }
  }

  if (isSource) {
    if (node.type === 'branch' || node.type === 'llm') {
      const isConditionType =
        node.type === 'llm' || node.data?.evaluationType === 'CONDITION';

      let allHandles: string[] = [];

      if (isConditionType) {
        const conds = node.data?.conditions || [];
        allHandles = conds.map(
          (c: any, idx: number) =>
            node.data?.replies?.[idx]?.value || c.id || String(idx),
        );
        allHandles.push('default');
      } else {
        const replies = node.data?.replies || [];
        allHandles = replies.map((r: any) => String(r.value));
      }

      const getPos = (hId: string) =>
        node.data?.outputPositions?.[hId] ||
        node.data?.outputPosition ||
        'right';

      const targetHandleId = handleId || 'default';
      return getPos(targetHandleId);
    }

    return (
      node.data?.outputPositions?.[handleId || 'default'] ||
      node.data?.outputPosition ||
      'right'
    );
  } else {
    return node.data?.inputPosition ?? 'left';
  }
};

export const getHandleOffset = (
  node: any,
  isSource: boolean,
  handleId?: string,
) => {
  const { width, height } = getNodeDimensions(node);

  if (node.type === 'ynBranch') {
    if (isSource) {
      const hId = handleId === 'N' ? 'N' : 'Y';
      const posY = node.data?.outputPositions?.['Y'] || 'right';
      const posN = node.data?.outputPositions?.['N'] || 'bottom';

      const targetSide = hId === 'Y' ? posY : posN;
      const sameSideHandles = ['Y', 'N'].filter(
        (id) => (id === 'Y' ? posY : posN) === targetSide,
      );
      const indexOnSide = sameSideHandles.indexOf(hId);
      const countOnSide = sameSideHandles.length || 1;
      const ratio = (indexOnSide + 1) / (countOnSide + 1);

      if (targetSide === 'bottom') {
        return { offsetX: width * ratio, offsetY: height };
      }
      return { offsetX: width, offsetY: height * ratio };
    } else {
      const inputPos = node.data?.inputPosition ?? 'left';
      if (inputPos === 'top') {
        return { offsetX: width / 2, offsetY: 0 };
      }
      return { offsetX: 0, offsetY: height / 2 };
    }
  }

  if (node.type === 'delay') {
    if (isSource) {
      const pos =
        node.data?.outputPositions?.['default'] ||
        node.data?.outputPosition ||
        'right';
      if (pos === 'bottom') return { offsetX: width / 2, offsetY: height };
      return { offsetX: width, offsetY: height / 2 };
    } else {
      const inputPos = node.data?.inputPosition ?? 'left';
      if (inputPos === 'top') return { offsetX: width / 2, offsetY: 0 };
      return { offsetX: 0, offsetY: height / 2 };
    }
  }

  if (isSource) {
    if (node.type === 'branch' || node.type === 'llm') {
      const isConditionType =
        node.type === 'llm' || node.data?.evaluationType === 'CONDITION';

      let allHandles: string[] = [];

      if (isConditionType) {
        const conds = node.data?.conditions || [];
        allHandles = conds.map(
          (c: any, idx: number) =>
            node.data?.replies?.[idx]?.value || c.id || String(idx),
        );
        allHandles.push('default');
      } else {
        const replies = node.data?.replies || [];
        allHandles = replies.map((r: any) => String(r.value));
      }

      const getPos = (hId: string) =>
        node.data?.outputPositions?.[hId] ||
        node.data?.outputPosition ||
        'right';

      const targetHandleId = handleId || 'default';
      const targetSide = getPos(targetHandleId);

      const handlesOnSide = allHandles.filter((h) => getPos(h) === targetSide);
      let indexOnSide = handlesOnSide.indexOf(targetHandleId);
      if (indexOnSide === -1) indexOnSide = 0;
      const countOnSide = handlesOnSide.length || 1;
      const ratio = (indexOnSide + 1) / (countOnSide + 1);

      if (targetSide === 'bottom') {
        return { offsetX: width * ratio, offsetY: height };
      }
      return { offsetX: width, offsetY: height * ratio };
    }

    const pos =
      node.data?.outputPositions?.[handleId || 'default'] ||
      node.data?.outputPosition ||
      'right';

    if (pos === 'bottom') {
      return { offsetX: width / 2, offsetY: height };
    }
    return { offsetX: width, offsetY: height / 2 };
  } else {
    const inputPos = node.data?.inputPosition ?? 'left';
    if (inputPos === 'top') {
      return { offsetX: width / 2, offsetY: 0 };
    }
    return { offsetX: 0, offsetY: height / 2 };
  }
};

export function alignScenarioNodes(nodes: Node[], edges: Edge[]) {
  if (!nodes || nodes.length === 0) return { nodes, edges };

  const nodeMap = new Map<string, Node>();
  nodes.forEach((node) => nodeMap.set(node.id, node));

  // Separate non-delay nodes and delay nodes
  const regularNodes = nodes.filter((n) => n.type !== 'delay');
  const delayNodes = nodes.filter((n) => n.type === 'delay');

  // Find effective connections between regular nodes by bypassing delay nodes
  const effectiveEdges: {
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
    delays: Node[]; // ordered delay nodes along this edge
  }[] = [];

  const processedDelays = new Set<string>();

  // Process outgoing edges from regular nodes
  regularNodes.forEach((regNode) => {
    const outEdges = edges.filter((e) => e.source === regNode.id);
    outEdges.forEach((outEdge) => {
      let currTargetId = outEdge.target;
      let currTargetNode = nodeMap.get(currTargetId);
      const chainDelays: Node[] = [];
      let finalTargetHandle = outEdge.targetHandle ?? undefined;

      while (currTargetNode && currTargetNode.type === 'delay') {
        chainDelays.push(currTargetNode);
        processedDelays.add(currTargetNode.id);
        const nextEdge = edges.find((e) => e.source === currTargetNode!.id);
        if (!nextEdge) break;
        currTargetId = nextEdge.target;
        finalTargetHandle = nextEdge.targetHandle ?? undefined;
        currTargetNode = nodeMap.get(currTargetId);
      }

      if (currTargetNode && currTargetNode.type !== 'delay') {
        effectiveEdges.push({
          source: regNode.id,
          target: currTargetNode.id,
          sourceHandle: outEdge.sourceHandle ?? undefined,
          targetHandle: finalTargetHandle,
          delays: chainDelays,
        });
      }
    });
  });

  // Regular node layout using Dagre & handle alignment
  const regularNodeMap = new Map<string, Node>();
  regularNodes.forEach((n) => regularNodeMap.set(n.id, n));

  const isVerticalEdge = (e: {
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
  }) => {
    const srcNode = nodeMap.get(e.source);
    const tgtNode = nodeMap.get(e.target);
    if (!srcNode || !tgtNode) return false;
    const srcSide = getHandleSide(srcNode, true, e.sourceHandle);
    const tgtSide = getHandleSide(tgtNode, false, e.targetHandle);
    return srcSide === 'bottom' && tgtSide === 'top';
  };

  const verticalEdges = effectiveEdges.filter(isVerticalEdge);
  const horizontalEdges = effectiveEdges.filter((e) => !isVerticalEdge(e));

  // Also include direct edges between regular nodes if any weren't captured
  edges.forEach((e) => {
    const src = nodeMap.get(e.source);
    const tgt = nodeMap.get(e.target);
    if (src && tgt && src.type !== 'delay' && tgt.type !== 'delay') {
      const exists = effectiveEdges.some(
        (ee) => ee.source === e.source && ee.target === e.target,
      );
      if (!exists) {
        const isVert =
          getHandleSide(src, true, e.sourceHandle ?? undefined) === 'bottom' &&
          getHandleSide(tgt, false, e.targetHandle ?? undefined) === 'top';
        if (isVert) {
          verticalEdges.push({
            source: e.source,
            target: e.target,
            sourceHandle: e.sourceHandle ?? undefined,
            targetHandle: e.targetHandle ?? undefined,
            delays: [],
          });
        } else {
          horizontalEdges.push({
            source: e.source,
            target: e.target,
            sourceHandle: e.sourceHandle ?? undefined,
            targetHandle: e.targetHandle ?? undefined,
            delays: [],
          });
        }
      }
    }
  });

  // Dagre Graph for regular nodes
  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: 'LR',
    nodesep: 40,
    ranksep: 100,
    marginx: 50,
    marginy: 50,
  });
  g.setDefaultEdgeLabel(() => ({}));

  regularNodes.forEach((node) => {
    const { width, height } = getNodeDimensions(node);
    g.setNode(node.id, { width, height });
  });

  horizontalEdges.forEach((edge) => {
    if (regularNodeMap.has(edge.source) && regularNodeMap.has(edge.target)) {
      g.setEdge(edge.source, edge.target);
    }
  });

  dagre.layout(g);

  // Group regular nodes by rank / column
  const rankMap = new Map<number, string[]>();
  regularNodes.forEach((node) => {
    const dagreNode = g.node(node.id);
    const rank =
      dagreNode && dagreNode.rank !== undefined
        ? dagreNode.rank
        : Math.round((dagreNode?.x || 0) / 350);
    if (!rankMap.has(rank)) {
      rankMap.set(rank, []);
    }
    rankMap.get(rank)!.push(node.id);
  });

  const sortedRanks = Array.from(rankMap.keys()).sort((a, b) => a - b);

  // X positions for regular node columns
  const columnXMap = new Map<number, number>();
  let currentX = 50;

  sortedRanks.forEach((rank) => {
    columnXMap.set(rank, currentX);
    let maxColWidth = 0;
    const nodeIdsInRank = rankMap.get(rank)!;
    nodeIdsInRank.forEach((id) => {
      const node = regularNodeMap.get(id)!;
      const { width } = getNodeDimensions(node);
      if (width > maxColWidth) {
        maxColWidth = width;
      }
    });
    currentX += maxColWidth + 100;
  });

  const posMap = new Map<string, { x: number; y: number }>();

  // Y positions for regular nodes (horizontal alignment)
  sortedRanks.forEach((rank, rankIdx) => {
    const nodeIds = rankMap.get(rank)!;
    const colX = columnXMap.get(rank)!;

    if (rankIdx === 0) {
      nodeIds.sort((a, b) => (g.node(a)?.y || 0) - (g.node(b)?.y || 0));

      let currentY = 50;
      nodeIds.forEach((id) => {
        const node = regularNodeMap.get(id)!;
        const { height } = getNodeDimensions(node);
        posMap.set(id, { x: colX, y: currentY });
        currentY += height + 40;
      });
    } else {
      nodeIds.forEach((id) => {
        const node = regularNodeMap.get(id)!;
        const { height } = getNodeDimensions(node);
        const incomingHoriz = horizontalEdges.filter((e) => e.target === id);

        if (incomingHoriz.length > 0) {
          const tgtHandleId = incomingHoriz[0].targetHandle;
          const tgtOffset = getHandleOffset(node, false, tgtHandleId);

          let totalIdealY = 0;
          let validCount = 0;

          incomingHoriz.forEach((edge) => {
            const parentPos = posMap.get(edge.source);
            const parentNode = regularNodeMap.get(edge.source);
            if (parentPos && parentNode) {
              const srcOffset = getHandleOffset(
                parentNode,
                true,
                edge.sourceHandle,
              );
              const srcHandleY = parentPos.y + srcOffset.offsetY;
              const idealY = srcHandleY - tgtOffset.offsetY;
              totalIdealY += idealY;
              validCount++;
            }
          });

          const idealY =
            validCount > 0
              ? totalIdealY / validCount
              : (g.node(id)?.y || 50) - height / 2;
          posMap.set(id, { x: colX, y: idealY });
        } else {
          const dagreY = g.node(id)?.y || 50;
          posMap.set(id, { x: colX, y: dagreY - height / 2 });
        }
      });
    }
  });

  // Vertical edges post-process (bottom -> top)
  verticalEdges.forEach((vEdge) => {
    const parentNode = regularNodeMap.get(vEdge.source);
    const childNode = regularNodeMap.get(vEdge.target);
    const parentPos = posMap.get(vEdge.source);

    if (parentNode && childNode && parentPos) {
      const srcOffset = getHandleOffset(parentNode, true, vEdge.sourceHandle);
      const tgtOffset = getHandleOffset(childNode, false, vEdge.targetHandle);
      const { height: parentHeight } = getNodeDimensions(parentNode);

      const idealX = parentPos.x + srcOffset.offsetX - tgtOffset.offsetX;
      const idealY = parentPos.y + parentHeight + 100;

      posMap.set(childNode.id, { x: idealX, y: idealY });
    }
  });

  // Overlap resolution for regular nodes
  const placedRegular = regularNodes.map((node) => {
    const pos = posMap.get(node.id) || { x: 50, y: 50 };
    return {
      node,
      pos,
      dims: getNodeDimensions(node),
    };
  });

  placedRegular.sort((a, b) => a.pos.y - b.pos.y);

  for (let i = 0; i < placedRegular.length - 1; i++) {
    const curr = placedRegular[i];
    for (let j = i + 1; j < placedRegular.length; j++) {
      const next = placedRegular[j];
      const currRight = curr.pos.x + curr.dims.width;
      const nextRight = next.pos.x + next.dims.width;
      const hasXOverlap =
        Math.max(curr.pos.x, next.pos.x) < Math.min(currRight, nextRight);

      if (hasXOverlap) {
        const minY = curr.pos.y + curr.dims.height + 40;
        if (next.pos.y < minY) {
          next.pos.y = minY;
          posMap.set(next.node.id, { x: next.pos.x, y: minY });
        }
      }
    }
  }

  // Place Delay Nodes on edge segments
  effectiveEdges.forEach((effEdge) => {
    if (effEdge.delays.length === 0) return;

    const parentNode = regularNodeMap.get(effEdge.source);
    const targetNode = regularNodeMap.get(effEdge.target);
    const parentPos = posMap.get(effEdge.source);
    const targetPos = posMap.get(effEdge.target);

    if (parentNode && targetNode && parentPos && targetPos) {
      const srcOffset = getHandleOffset(parentNode, true, effEdge.sourceHandle);
      const tgtOffset = getHandleOffset(
        targetNode,
        false,
        effEdge.targetHandle,
      );

      const startX = parentPos.x + srcOffset.offsetX;
      const startY = parentPos.y + srcOffset.offsetY;
      const endX = targetPos.x + tgtOffset.offsetX;
      const endY = targetPos.y + tgtOffset.offsetY;

      const k = effEdge.delays.length;
      effEdge.delays.forEach((delayNode, idx) => {
        const t = (idx + 1) / (k + 1);
        const midX = startX + t * (endX - startX);
        const midY = startY + t * (endY - startY);

        // Center 36x36 delay node on the line
        posMap.set(delayNode.id, {
          x: Math.round(midX - 18),
          y: Math.round(midY - 18),
        });
      });
    }
  });

  // Handle any remaining unplaced delay nodes (e.g. disconnected or end of chain)
  delayNodes.forEach((dNode) => {
    if (!posMap.has(dNode.id)) {
      const inEdge = edges.find((e) => e.target === dNode.id);
      if (inEdge && posMap.has(inEdge.source)) {
        const parentNode = nodeMap.get(inEdge.source);
        const parentPos = posMap.get(inEdge.source)!;
        if (parentNode) {
          const srcOffset = getHandleOffset(
            parentNode,
            true,
            inEdge.sourceHandle ?? undefined,
          );
          const srcSide = getHandleSide(
            parentNode,
            true,
            inEdge.sourceHandle ?? undefined,
          );
          if (srcSide === 'bottom') {
            posMap.set(dNode.id, {
              x: Math.round(parentPos.x + srcOffset.offsetX - 18),
              y: Math.round(
                parentPos.y + getNodeDimensions(parentNode).height + 50,
              ),
            });
          } else {
            posMap.set(dNode.id, {
              x: Math.round(
                parentPos.x + getNodeDimensions(parentNode).width + 50,
              ),
              y: Math.round(parentPos.y + srcOffset.offsetY - 18),
            });
          }
        }
      } else {
        posMap.set(dNode.id, { x: 100, y: 100 });
      }
    }
  });

  // Build final nodes array
  const newNodes = nodes.map((node) => {
    const pos = posMap.get(node.id) || { x: 50, y: 50 };
    return {
      ...node,
      position: {
        x: Math.round(pos.x),
        y: Math.round(pos.y),
      },
    };
  });

  return { nodes: newNodes, edges };
}
