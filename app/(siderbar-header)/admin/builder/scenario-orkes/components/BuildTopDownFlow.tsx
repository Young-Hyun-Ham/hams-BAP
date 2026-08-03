import { MarkerType, type Node } from 'reactflow';

import { FLOW_NODE_SIZES } from '../constants/nodeSizes';

import type {
  AddNodeData,
  BuilderEdge,
  BuilderNode,
  InsertTarget,
  NodeSize,
} from '../types';

export const START_NODE_ID = '__flow_uipath_start__';
export const START_ADD_NODE_ID = '__flow_uipath_start_add__';
export const END_NODE_ID = '__flow_uipath_end__';
export const panelBorder = '#d6dde5';
export const lineColor = '#8f9daa';

const nodeWidth: number = FLOW_NODE_SIZES.defaultWidth;
const defaultNodeHeight: number = FLOW_NODE_SIZES.defaultHeight;
const addNodeSize = 18;
const edgeSegmentLength = 15; // edge 선 길이
const verticalGap = edgeSegmentLength * 2 + addNodeSize;
const apiFanoutDropY = 15;
const apiFanoutCurveRoom = 48;
const laneGapX = 80;
const branchMinWidth: number = FLOW_NODE_SIZES.branchMinWidth;
const branchMinHeight: number = FLOW_NODE_SIZES.branchMinHeight;
const branchPaddingX = 38;
const branchLaneGapX = 96;
const branchHeaderHeight = 42;
const branchSummaryBaseHeight = 82;
const branchTextLineHeight = 16;
const branchCaseGapY = 24;
const branchBottomPadding = 42;
const branchEmbeddedGroupWidth = 420;
const estimatedGroupMinWidth = 800;
const estimatedGroupMinHeight = 260;
const estimatedGroupPaddingX = 36;
const estimatedGroupFirstChildY = 150;
const estimatedGroupBottomPadding = 56;
const collapsedGroupHeight = 28;

const getBranchTextLineCount = (node: BuilderNode) => {
  const data = node.data as BuilderNode['data'] & { content?: string };
  const content = String(data?.content || 'No branch text added.');
  const explicitLines = content.split(/\r\n|\r|\n/).length;
  const wrappedLines = Math.ceil(content.length / 80);

  return Math.max(1, explicitLines, wrappedLines);
};

const getBranchSummaryHeight = (node: BuilderNode) =>
  node.data?.flowCollapsed
    ? 0
    : branchSummaryBaseHeight +
      Math.max(0, getBranchTextLineCount(node) - 1) * branchTextLineHeight;

const getBranchAddY = (node: BuilderNode) =>
  branchHeaderHeight +
  Math.max(0, getBranchSummaryHeight(node) - addNodeSize / 2);

const getBranchCaseTop = (node: BuilderNode) =>
  getBranchAddY(node) + addNodeSize / 2 + branchCaseGapY;

const getBranchFirstChildY = (node: BuilderNode) => getBranchCaseTop(node) + 56;

export const defaultEdgeOptions = {
  type: 'default',
  markerEnd: { type: MarkerType.ArrowClosed, color: lineColor },
  style: { stroke: lineColor, strokeWidth: 1.35 },
};

export const getTopLevelNodes = (nodes: BuilderNode[]) =>
  nodes.filter((node) => !node.parentNode);

export const getStartNode = (
  nodes: BuilderNode[],
  edges: BuilderEdge[],
  startNodeId?: string | null,
) => {
  const topLevelNodes = getTopLevelNodes(nodes);
  if (startNodeId) {
    const configuredStart = topLevelNodes.find(
      (node) => node.id === startNodeId,
    );
    if (configuredStart) return configuredStart;
  }

  return (
    topLevelNodes.find(
      (node) => !edges.some((edge) => edge.target === node.id),
    ) ||
    topLevelNodes
      .slice()
      .sort((a, b) => (a.position?.y ?? 0) - (b.position?.y ?? 0))[0] ||
    null
  );
};

const getOutgoingEdges = (nodeId: string, edges: BuilderEdge[]) =>
  edges
    .filter((edge) => edge.source === nodeId)
    .sort((a, b) => {
      const handleOrder: Record<string, number> = {
        default: 0,
        onSuccess: 1,
        onError: 2,
      };
      const aHandle = String(a.sourceHandle || 'default');
      const bHandle = String(b.sourceHandle || 'default');
      const aOrder = handleOrder[aHandle] ?? 100;
      const bOrder = handleOrder[bHandle] ?? 100;

      if (aOrder !== bOrder) return aOrder - bOrder;

      return aHandle.localeCompare(bHandle);
    });

const normalizeSourceHandle = (sourceHandle?: string | null) =>
  !sourceHandle || sourceHandle === 'default' ? null : sourceHandle;

let displayEdgeCounter = 0;

export const createWorkflowEdge = ({
  source,
  target,
  sourceHandle,
}: {
  source: string;
  target: string;
  sourceHandle?: string | null;
}): BuilderEdge => ({
  id: `reactflow__edge-${source}${sourceHandle || ''}-${target}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  source,
  target,
  sourceHandle: normalizeSourceHandle(sourceHandle),
  targetHandle: null,
  ...defaultEdgeOptions,
});

const createDisplayEdge = (
  source: string,
  target: string,
  sourceHandle?: string | null,
): BuilderEdge => {
  displayEdgeCounter += 1;
  return {
    id: `flow-uipath-${source}${sourceHandle || ''}-${target}-${displayEdgeCounter}`,
    source,
    target,
    sourceHandle: normalizeSourceHandle(sourceHandle),
    targetHandle: null,
    ...defaultEdgeOptions,
  };
};

const createEndDisplayEdge = (
  source: string,
  target: string,
  sourceHandle?: string | null,
): BuilderEdge => {
  const edge = createDisplayEdge(source, target, sourceHandle);

  return {
    ...edge,
    type: 'endMerge',
    markerEnd: undefined,
  };
};

const createFanoutDisplayEdge = (
  source: string,
  target: string,
  sourceHandle?: string | null,
): BuilderEdge => {
  const edge = createDisplayEdge(source, target, sourceHandle);

  return {
    ...edge,
    type: 'fanoutCurve',
  };
};

const getBranchHandles = (node: BuilderNode) => {
  const data = node.data || {};

  if (node.type === 'api') return ['onSuccess', 'onError'];

  if (node.type !== 'branch') return ['default'];

  if (data.evaluationType === 'CONDITION' && data.conditions?.length) {
    return [
      ...data.conditions.map(
        (condition, index) =>
          data.replies?.[index]?.value || condition.id || `condition-${index}`,
      ),
      'default',
    ];
  }

  if (data.replies?.length) {
    return data.replies.map((reply, index) => reply.value || `reply-${index}`);
  }

  return ['default'];
};

const getApiHandleRatio = (handleId: string) => {
  if (handleId === 'onSuccess') return 0.35;
  if (handleId === 'onError') return 0.65;

  return 0.5;
};

export const buildTopDownFlow = ({
  nodes,
  edges,
  startNode,
  nodeSizes,
  onOpenInsert,
}: {
  nodes: BuilderNode[];
  edges: BuilderEdge[];
  startNode: BuilderNode | null;
  nodeSizes: Record<string, NodeSize>;
  onOpenInsert: (target: InsertTarget) => void;
}) => {
  displayEdgeCounter = 0;
  const allNodesById = new Map(nodes.map((node) => [node.id, node]));
  const topLevelNodes = getTopLevelNodes(nodes);
  const measured = new Map<string, number>();
  const depthByNodeId = new Map<string, number>();
  const maxHeightByDepth = new Map<number, number>();
  const minGapToNextDepth = new Map<number, number>();
  const branchChildPositioned = new Map<string, { x: number; y: number }>();
  const branchChildParentById = new Map<string, string>();
  const branchAddNodes: Node<AddNodeData>[] = [];
  const branchDisplayEdges: BuilderEdge[] = [];
  const branchHeightById = new Map<string, number>();
  const branchWidthById = new Map<string, number>();
  const branchCaseTopsById = new Map<string, number[]>();
  const branchCaseHeightsById = new Map<string, number[]>();
  const branchCaseLeftsById = new Map<string, number[]>();
  const branchCaseWidthsById = new Map<string, number[]>();
  const branchSummaryHeightById = new Map<string, number>();
  const branchEmbeddedGroupWidthById = new Map<string, number>();
  const branchEmbeddedGroupHeightById = new Map<string, number>();
  const branchLayoutDone = new Set<string>();
  const branchEmbeddedNodeIds = new Set<string>();
  const scenarioChildPositioned = new Map<string, { x: number; y: number }>();
  const scenarioWidthById = new Map<string, number>();
  const scenarioHeightById = new Map<string, number>();
  const scenarioLayoutDone = new Set<string>();
  const scenarioLayoutInProgress = new Set<string>();

  const getNodeSize = (nodeId: string): NodeSize => {
    const node = allNodesById.get(nodeId);
    const nodeStyle = (node?.style || {}) as Record<string, unknown>;
    const nodeData = (node?.data || {}) as Record<string, unknown>;

    return {
      width:
        (node?.type === 'scenario' ? scenarioWidthById.get(nodeId) : null) ||
        (node?.type === 'branch' ? branchWidthById.get(nodeId) : null) ||
        nodeSizes[nodeId]?.width ||
        Number(nodeData.flowScenarioWidth || nodeStyle.width) ||
        nodeWidth,
      height:
        (node?.type === 'scenario' ? scenarioHeightById.get(nodeId) : null) ||
        (node?.type === 'branch' ? branchHeightById.get(nodeId) : null) ||
        nodeSizes[nodeId]?.height ||
        Number(nodeData.flowScenarioHeight || nodeStyle.height) ||
        defaultNodeHeight,
    };
  };
  const isCollapsedContainer = (node?: BuilderNode) =>
    (node?.type === 'selectionGroup' && node.data?.flowCollapsed === true) ||
    node?.type === 'scenario';
  const isCollapsedGroup = (node?: BuilderNode) =>
    (node?.type === 'selectionGroup' ||
      node?.type === 'group' ||
      node?.type === 'groupNode') &&
    node.data?.flowCollapsed === true;
  const isScenarioDescendant = (node?: BuilderNode) => {
    let parentId = node?.parentNode;

    while (parentId) {
      const parentNode = allNodesById.get(parentId);
      if (!parentNode) return false;
      if (
        parentNode.type === 'scenario' ||
        parentNode.type === 'group' ||
        parentNode.type === 'groupNode' ||
        parentNode.type === 'selectionGroup'
      )
        return true;
      parentId = parentNode.parentNode;
    }

    return false;
  };
  const getAncestorContainer = (
    node?: { parentNode?: string | null },
    containerTypes: string[] = [
      'selectionGroup',
      'scenario',
      'group',
      'groupNode',
    ],
  ) => {
    let parentId = node?.parentNode;

    while (parentId) {
      const parentNode = allNodesById.get(parentId);
      if (!parentNode) return null;
      if (parentNode.type && containerTypes.includes(parentNode.type)) {
        return parentNode;
      }
      parentId = parentNode.parentNode;
    }

    return null;
  };
  const childNodeIdsByParentId = new Map<string, string[]>();
  const targetNodeIdsBySourceId = new Map<string, string[]>();

  nodes.forEach((node) => {
    if (!node.parentNode) return;
    childNodeIdsByParentId.set(node.parentNode, [
      ...(childNodeIdsByParentId.get(node.parentNode) || []),
      node.id,
    ]);
  });

  edges.forEach((edge) => {
    targetNodeIdsBySourceId.set(edge.source, [
      ...(targetNodeIdsBySourceId.get(edge.source) || []),
      edge.target,
    ]);
  });

  const hiddenNodeIds = new Set<string>();
  const markHiddenByCollapsedContainer = (
    nodeId: string,
    followEdges: boolean,
    visited = new Set<string>(),
  ) => {
    if (visited.has(nodeId)) return;

    const node = allNodesById.get(nodeId);
    if (!node) return;

    hiddenNodeIds.add(nodeId);

    const nextVisited = new Set(visited);
    nextVisited.add(nodeId);

    childNodeIdsByParentId
      .get(nodeId)
      ?.forEach((childNodeId) =>
        markHiddenByCollapsedContainer(childNodeId, followEdges, nextVisited),
      );

    if (followEdges) {
      targetNodeIdsBySourceId
        .get(nodeId)
        ?.forEach((targetNodeId) =>
          markHiddenByCollapsedContainer(targetNodeId, true, nextVisited),
        );
    }
  };

  nodes.forEach((node) => {
    if (!isCollapsedContainer(node)) return;

    childNodeIdsByParentId
      .get(node.id)
      ?.forEach((childNodeId) =>
        markHiddenByCollapsedContainer(childNodeId, false),
      );
  });

  const isHiddenByCollapsedAncestor = (node: BuilderNode) => {
    if (hiddenNodeIds.has(node.id)) return true;

    let parentId = node.parentNode;

    while (parentId) {
      const parentNode = allNodesById.get(parentId);
      if (!parentNode) return false;
      if (isCollapsedContainer(parentNode)) return true;
      parentId = parentNode.parentNode;
    }

    return false;
  };

  const getBranchDisplaySize = (nodeId: string): NodeSize => ({
    width: branchWidthById.get(nodeId) || getNodeSize(nodeId).width,
    height: branchHeightById.get(nodeId) || getNodeSize(nodeId).height,
  });
  const getBranchEmbeddedGroupSize = (node: BuilderNode): NodeSize => {
    const estimated = estimateGroupDisplaySize(node);
    const width = Math.max(nodeWidth, estimated.width);
    const height = Math.max(estimatedGroupMinHeight, estimated.height);

    branchEmbeddedGroupWidthById.set(node.id, width);
    branchEmbeddedGroupHeightById.set(node.id, height);

    return {
      width,
      height,
    };
  };

  const getEdgeForHandle = (nodeId: string, handleId: string) => {
    const sourceHandle = normalizeSourceHandle(handleId);
    return edges.find(
      (edge) =>
        edge.source === nodeId &&
        normalizeSourceHandle(edge.sourceHandle) === sourceHandle,
    );
  };

  const layoutScenarioChildren = (scenarioNode: BuilderNode) => {
    if (
      scenarioLayoutDone.has(scenarioNode.id) ||
      scenarioLayoutInProgress.has(scenarioNode.id)
    ) {
      return;
    }

    scenarioLayoutInProgress.add(scenarioNode.id);

    if (
      (scenarioNode.data as Record<string, unknown> | undefined)?.isCollapsed
    ) {
      scenarioWidthById.set(scenarioNode.id, 250);
      scenarioHeightById.set(scenarioNode.id, collapsedGroupHeight);
      scenarioLayoutInProgress.delete(scenarioNode.id);
      scenarioLayoutDone.add(scenarioNode.id);
      return;
    }

    const paddingX = 40;
    const firstChildY = 88;
    const bottomPadding = 64;
    const children = nodes
      .filter(
        (node) =>
          node.parentNode === scenarioNode.id &&
          !isHiddenByCollapsedAncestor(node),
      )
      .slice()
      .sort((a, b) => (a.position?.y || 0) - (b.position?.y || 0));

    if (!children.length) {
      scenarioWidthById.set(
        scenarioNode.id,
        getNodeSize(scenarioNode.id).width,
      );
      scenarioHeightById.set(
        scenarioNode.id,
        getNodeSize(scenarioNode.id).height,
      );
      scenarioLayoutInProgress.delete(scenarioNode.id);
      scenarioLayoutDone.add(scenarioNode.id);
      return;
    }

    const childIds = new Set(children.map((child) => child.id));
    const childEdges = edges.filter(
      (edge) => childIds.has(edge.source) && childIds.has(edge.target),
    );
    const childById = new Map(children.map((child) => [child.id, child]));
    const measureCache = new Map<string, number>();
    const getScenarioChildSize = (node: BuilderNode): NodeSize => {
      if (node.type === 'scenario') {
        layoutScenarioChildren(node);
        return getNodeSize(node.id);
      }

      if (
        node.type === 'selectionGroup' ||
        node.type === 'group' ||
        node.type === 'groupNode'
      ) {
        return estimateGroupDisplaySize(node);
      }

      return getNodeSize(node.id);
    };

    const getChildEdgeForHandle = (nodeId: string, handleId: string) => {
      const sourceHandle = normalizeSourceHandle(handleId);

      return childEdges.find(
        (edge) =>
          edge.source === nodeId &&
          normalizeSourceHandle(edge.sourceHandle) === sourceHandle,
      );
    };

    const measureScenarioSubtree = (
      nodeId: string,
      visited = new Set<string>(),
    ): number => {
      if (visited.has(nodeId)) return nodeWidth;
      if (measureCache.has(nodeId))
        return measureCache.get(nodeId) || nodeWidth;

      const node = childById.get(nodeId);
      if (!node) return nodeWidth;

      const size = getScenarioChildSize(node);
      const handles = getBranchHandles(node);
      const nextVisited = new Set(visited);
      nextVisited.add(nodeId);
      const childWidths = handles.map((handleId) => {
        const edge = getChildEdgeForHandle(nodeId, handleId);

        return edge?.target
          ? measureScenarioSubtree(edge.target, nextVisited)
          : nodeWidth;
      });
      if (node.type === 'branch') {
        const lanesWidth =
          childWidths.reduce((sum, width) => sum + width, 0) +
          branchLaneGapX * Math.max(0, childWidths.length - 1);
        const branchWidth = Math.max(
          branchMinWidth,
          lanesWidth + branchPaddingX * 2,
        );
        const branchCaseTop = getBranchCaseTop(node);
        let nextLaneX = (branchWidth - lanesWidth) / 2;
        const caseTops: number[] = [];
        const caseHeights: number[] = [];
        const caseLefts: number[] = [];
        const caseWidths: number[] = [];

        childWidths.forEach((laneWidth) => {
          caseLefts.push(nextLaneX);
          caseWidths.push(laneWidth);
          caseTops.push(branchCaseTop);
          caseHeights.push(44);
          nextLaneX += laneWidth + branchLaneGapX;
        });

        branchWidthById.set(node.id, branchWidth);
        branchSummaryHeightById.set(node.id, getBranchSummaryHeight(node));
        branchCaseTopsById.set(node.id, caseTops);
        branchCaseHeightsById.set(node.id, caseHeights);
        branchCaseLeftsById.set(node.id, caseLefts);
        branchCaseWidthsById.set(node.id, caseWidths);
        branchHeightById.set(node.id, branchMinHeight);
      }
      const subtreeWidth = Math.max(
        node.type === 'branch'
          ? branchWidthById.get(node.id) || size.width
          : size.width,
        childWidths.reduce((sum, width) => sum + width, 0) +
          laneGapX * Math.max(0, childWidths.length - 1),
      );

      measureCache.set(nodeId, subtreeWidth);
      return subtreeWidth;
    };

    let maxX = paddingX + nodeWidth;
    let maxY = firstChildY;
    const placed = new Set<string>();

    const placeScenarioSubtree = (
      nodeId: string,
      centerX: number,
      y: number,
      visited = new Set<string>(),
    ) => {
      if (visited.has(nodeId)) return;

      const node = childById.get(nodeId);
      if (!node) return;

      const size = getScenarioChildSize(node);
      const position = {
        x: Math.max(paddingX, centerX - size.width / 2),
        y,
      };

      scenarioChildPositioned.set(nodeId, position);
      placed.add(nodeId);
      maxX = Math.max(maxX, position.x + size.width);
      maxY = Math.max(maxY, position.y + size.height);

      const handles = getBranchHandles(node);
      const nextVisited = new Set(visited);
      nextVisited.add(nodeId);
      const childWidths = handles.map((handleId) => {
        const edge = getChildEdgeForHandle(nodeId, handleId);

        return edge?.target
          ? measureScenarioSubtree(edge.target, nextVisited)
          : nodeWidth;
      });
      const totalChildWidth =
        childWidths.reduce((sum, width) => sum + width, 0) +
        laneGapX * Math.max(0, childWidths.length - 1);
      let nextX = centerX - totalChildWidth / 2;

      handles.forEach((handleId, index) => {
        const edge = getChildEdgeForHandle(nodeId, handleId);
        const laneWidth = childWidths[index];
        const childCenterX =
          node.type === 'branch'
            ? position.x +
              (branchCaseLeftsById.get(node.id)?.[index] || 0) +
              (branchCaseWidthsById.get(node.id)?.[index] || laneWidth) / 2
            : nextX + laneWidth / 2;

        if (edge?.target && !nextVisited.has(edge.target)) {
          placeScenarioSubtree(
            edge.target,
            childCenterX,
            y + size.height + verticalGap,
            nextVisited,
          );
        }

        nextX += laneWidth + laneGapX;
      });
    };

    const incomingTargets = new Set(childEdges.map((edge) => edge.target));
    const roots = children.filter((child) => !incomingTargets.has(child.id));
    const layoutRoots = roots.length ? roots : children.slice(0, 1);
    const rootWidths = layoutRoots.map((root) =>
      measureScenarioSubtree(root.id),
    );
    const totalRootWidth =
      rootWidths.reduce((sum, width) => sum + width, 0) +
      laneGapX * Math.max(0, rootWidths.length - 1);
    const scenarioWidth = Math.max(620, totalRootWidth + paddingX * 2);
    let rootX = scenarioWidth / 2 - totalRootWidth / 2;

    layoutRoots.forEach((root, index) => {
      const rootWidth = rootWidths[index];
      placeScenarioSubtree(root.id, rootX + rootWidth / 2, firstChildY);
      rootX += rootWidth + laneGapX;
    });

    children.forEach((child) => {
      if (placed.has(child.id)) return;

      const childWidth = measureScenarioSubtree(child.id);
      placeScenarioSubtree(
        child.id,
        paddingX + childWidth / 2,
        maxY + verticalGap,
      );
    });

    let minPlacedX = Infinity;
    let maxPlacedX = -Infinity;

    children.forEach((child) => {
      const position = scenarioChildPositioned.get(child.id);
      if (!position) return;

      const childSize = getScenarioChildSize(child);
      minPlacedX = Math.min(minPlacedX, position.x);
      maxPlacedX = Math.max(maxPlacedX, position.x + childSize.width);
    });

    const contentWidth =
      Number.isFinite(minPlacedX) && Number.isFinite(maxPlacedX)
        ? maxPlacedX - minPlacedX
        : totalRootWidth;
    const finalScenarioWidth = Math.max(
      scenarioWidth,
      contentWidth + paddingX * 2,
    );

    if (Number.isFinite(minPlacedX) && Number.isFinite(maxPlacedX)) {
      const targetContentLeft = (finalScenarioWidth - contentWidth) / 2;
      const shiftX = targetContentLeft - minPlacedX;

      children.forEach((child) => {
        const position = scenarioChildPositioned.get(child.id);
        if (!position) return;

        scenarioChildPositioned.set(child.id, {
          ...position,
          x: position.x + shiftX,
        });
      });
    }

    scenarioWidthById.set(scenarioNode.id, finalScenarioWidth);
    scenarioHeightById.set(
      scenarioNode.id,
      Math.max(260, maxY + bottomPadding),
    );
    scenarioLayoutInProgress.delete(scenarioNode.id);
    scenarioLayoutDone.add(scenarioNode.id);
  };

  const estimateGroupDisplaySize = (
    groupNode: BuilderNode,
    visitedGroup = new Set<string>(),
  ): NodeSize => {
    if (isCollapsedGroup(groupNode)) {
      return {
        width: Math.max(
          estimatedGroupMinWidth,
          getNodeSize(groupNode.id).width,
        ),
        height: collapsedGroupHeight,
      };
    }

    if (visitedGroup.has(groupNode.id)) {
      return { width: estimatedGroupMinWidth, height: estimatedGroupMinHeight };
    }

    const nextVisitedGroup = new Set(visitedGroup);
    nextVisitedGroup.add(groupNode.id);
    const groupChildren = nodes
      .filter((node) => node.parentNode === groupNode.id)
      .slice()
      .sort((a, b) => (a.position?.y || 0) - (b.position?.y || 0));

    if (groupChildren.length === 0) {
      return { width: estimatedGroupMinWidth, height: estimatedGroupMinHeight };
    }

    const groupChildIds = new Set(groupChildren.map((child) => child.id));
    const groupEdges = edges.filter(
      (edge) =>
        groupChildIds.has(edge.source) && groupChildIds.has(edge.target),
    );
    const entryChildren = groupChildren.filter(
      (child) => !groupEdges.some((edge) => edge.target === child.id),
    );
    const roots =
      entryChildren.length > 0 ? entryChildren : groupChildren.slice(0, 1);

    const measureChild = (
      childNode: BuilderNode,
      visitedChild = new Set<string>(),
    ): NodeSize => {
      if (visitedChild.has(childNode.id)) return getNodeSize(childNode.id);

      if (childNode.type === 'branch') {
        layoutBranch(childNode, visitedChild);
        return getBranchDisplaySize(childNode.id);
      }

      if (childNode.type === 'selectionGroup') {
        return estimateGroupDisplaySize(childNode, nextVisitedGroup);
      }

      if (childNode.type === 'scenario') {
        layoutScenarioChildren(childNode);
        return getNodeSize(childNode.id);
      }

      const ownSize = getNodeSize(childNode.id);
      const nextEdge = groupEdges.find(
        (edge) =>
          edge.source === childNode.id &&
          normalizeSourceHandle(edge.sourceHandle) === null,
      );

      if (!nextEdge?.target) return ownSize;

      const targetNode = allNodesById.get(nextEdge.target);
      if (!targetNode) return ownSize;

      const nextVisitedChild = new Set(visitedChild);
      nextVisitedChild.add(childNode.id);
      const childSize = measureChild(targetNode, nextVisitedChild);

      return {
        width: Math.max(ownSize.width, childSize.width),
        height: ownSize.height + verticalGap + childSize.height,
      };
    };

    const rootSizes = roots.map((root) => measureChild(root));
    const width = Math.max(
      estimatedGroupMinWidth,
      Math.max(...rootSizes.map((size) => size.width)) +
        estimatedGroupPaddingX * 2,
    );
    const height = Math.max(
      estimatedGroupMinHeight,
      estimatedGroupFirstChildY +
        Math.max(...rootSizes.map((size) => size.height)) +
        estimatedGroupBottomPadding,
    );

    return { width, height };
  };

  nodes
    .filter(
      (node) => node.type === 'scenario' && !isHiddenByCollapsedAncestor(node),
    )
    .forEach((scenarioNode) => layoutScenarioChildren(scenarioNode));

  const measureBranchChainWidth = (
    nodeId: string,
    visitedSubtree = new Set<string>(),
  ): number => {
    if (visitedSubtree.has(nodeId)) return nodeWidth;

    const node = allNodesById.get(nodeId);
    if (!node) return nodeWidth;

    if (node.type === 'branch') {
      layoutBranch(node, visitedSubtree);
      return getBranchDisplaySize(node.id).width;
    }

    if (node.type === 'selectionGroup') {
      return getBranchEmbeddedGroupSize(node).width;
    }

    if (node.type === 'scenario') {
      layoutScenarioChildren(node);
      return getNodeSize(node.id).width;
    }

    const nodeSize = getNodeSize(node.id);
    const handles = getBranchHandles(node);
    const nextVisitedSubtree = new Set(visitedSubtree);
    nextVisitedSubtree.add(node.id);
    const childWidths = handles.map((handleId) => {
      const nextEdge = getEdgeForHandle(node.id, handleId);

      return nextEdge?.target
        ? measureBranchChainWidth(nextEdge.target, nextVisitedSubtree)
        : nodeWidth;
    });
    const childLaneWidth =
      childWidths.reduce((sum, width) => sum + width, 0) +
      laneGapX * Math.max(0, childWidths.length - 1);

    return Math.max(nodeSize.width, childLaneWidth);
  };

  function layoutBranch(branchNode: BuilderNode, visited = new Set<string>()) {
    if (branchLayoutDone.has(branchNode.id) || visited.has(branchNode.id)) {
      return;
    }

    const nextVisited = new Set(visited);
    nextVisited.add(branchNode.id);
    const branchContainerNode = getAncestorContainer(branchNode);

    const handles = getBranchHandles(branchNode);
    const laneWidths = handles.map((handleId) => {
      const existingEdge = getEdgeForHandle(branchNode.id, handleId);
      if (!existingEdge?.target) return nodeWidth;

      return Math.max(
        nodeWidth,
        measureBranchChainWidth(existingEdge.target, nextVisited),
      );
    });
    const lanesWidth =
      laneWidths.reduce((sum, width) => sum + width, 0) +
      branchLaneGapX * Math.max(0, laneWidths.length - 1);
    const branchWidth = Math.max(
      branchMinWidth,
      lanesWidth + branchPaddingX * 2,
    );
    const caseTops: number[] = [];
    const caseHeights: number[] = [];
    const caseLefts: number[] = [];
    const caseWidths: number[] = [];
    const laneCenters: number[] = [];
    const branchAddY = getBranchAddY(branchNode);
    const branchCaseTop = getBranchCaseTop(branchNode);
    const branchFirstChildY = getBranchFirstChildY(branchNode);
    let nextLaneX = (branchWidth - lanesWidth) / 2;
    let branchBottom = branchFirstChildY;

    branchWidthById.set(branchNode.id, branchWidth);
    branchSummaryHeightById.set(
      branchNode.id,
      getBranchSummaryHeight(branchNode),
    );

    laneWidths.forEach((laneWidth) => {
      const laneCenterX = nextLaneX + laneWidth / 2;

      laneCenters.push(laneCenterX);
      caseLefts.push(nextLaneX);
      caseWidths.push(laneWidth);
      caseTops.push(branchCaseTop);
      caseHeights.push(44);
      nextLaneX += laneWidth + branchLaneGapX;
    });

    const placeBranchChain = (
      childNode: BuilderNode,
      laneCenterX: number,
      y: number,
      incomingAddNodeId: string,
      visitedSubtree = new Set<string>(),
      useIncomingFanoutEdge = false,
    ): number => {
      if (visitedSubtree.has(childNode.id)) return y;

      if (childNode.type === 'branch') {
        layoutBranch(childNode, visitedSubtree);
      }

      const childSize =
        childNode.type === 'branch'
          ? getBranchDisplaySize(childNode.id)
          : childNode.type === 'selectionGroup'
            ? getBranchEmbeddedGroupSize(childNode)
            : childNode.type === 'scenario'
              ? (() => {
                  layoutScenarioChildren(childNode);
                  return getNodeSize(childNode.id);
                })()
              : getNodeSize(childNode.id);

      branchEmbeddedNodeIds.add(childNode.id);
      branchChildParentById.set(childNode.id, branchNode.id);
      const childPosition = {
        x: laneCenterX - childSize.width / 2,
        y,
      };

      branchChildPositioned.set(childNode.id, childPosition);
      branchDisplayEdges.push(
        useIncomingFanoutEdge
          ? createFanoutDisplayEdge(incomingAddNodeId, childNode.id)
          : createDisplayEdge(incomingAddNodeId, childNode.id),
      );

      if (childNode.type === 'branch') {
        return y + childSize.height;
      }

      const handles = getBranchHandles(childNode);
      const nextVisitedSubtree = new Set(visitedSubtree);
      nextVisitedSubtree.add(childNode.id);
      const childWidths = handles.map((handleId) => {
        const nextEdge = getEdgeForHandle(childNode.id, handleId);

        return nextEdge?.target
          ? measureBranchChainWidth(nextEdge.target, nextVisitedSubtree)
          : nodeWidth;
      });
      const totalChildWidth =
        childWidths.reduce((sum, width) => sum + width, 0) +
        laneGapX * Math.max(0, childWidths.length - 1);
      let nextX = laneCenterX - totalChildWidth / 2;
      let childBottom = y + childSize.height + edgeSegmentLength + addNodeSize;

      handles.forEach((handleId, index) => {
        const sourceHandle = normalizeSourceHandle(handleId);
        const nextEdge = getEdgeForHandle(childNode.id, handleId);
        const laneWidth = childWidths[index];
        const childLaneCenterX = nextX + laneWidth / 2;
        const addNodeId = `__flow_uipath_branch_add__${branchNode.id}__${childNode.id}__${handleId}`;
        const addY = y + childSize.height + edgeSegmentLength;

        branchAddNodes.push({
          id: addNodeId,
          type: 'add',
          parentNode: branchNode.id,
          extent: 'parent',
          position: {
            x: childLaneCenterX - addNodeSize / 2,
            y: addY,
          },
          draggable: false,
          selectable: false,
          data: {
            target: {
              parentId: branchContainerNode?.id,
              sourceId: childNode.id,
              sourceHandle,
              targetId: nextEdge?.target || null,
            },
            onAdd: onOpenInsert,
          },
        });
        branchDisplayEdges.push(
          childNode.type === 'api'
            ? createFanoutDisplayEdge(childNode.id, addNodeId, sourceHandle)
            : createDisplayEdge(childNode.id, addNodeId, sourceHandle),
        );

        if (nextEdge?.target) {
          const targetNode = allNodesById.get(nextEdge.target);
          if (targetNode) {
            childBottom = Math.max(
              childBottom,
              placeBranchChain(
                targetNode,
                childLaneCenterX,
                y + childSize.height + verticalGap,
                addNodeId,
                nextVisitedSubtree,
                childNode.type === 'api',
              ),
            );
          }
        }

        nextX += laneWidth + laneGapX;
      });

      return childBottom;
    };

    handles.forEach((handleId, index) => {
      const sourceHandle = normalizeSourceHandle(handleId);
      const existingEdge = getEdgeForHandle(branchNode.id, handleId);
      const addNodeId = `__flow_uipath_branch_add__${branchNode.id}__${handleId}`;
      const laneCenterX = laneCenters[index] || branchWidth / 2;
      let laneBottom = branchAddY + addNodeSize;

      branchAddNodes.push({
        id: addNodeId,
        type: 'add',
        parentNode: branchNode.id,
        extent: 'parent',
        position: {
          x: laneCenterX - addNodeSize / 2,
          y: branchAddY,
        },
        draggable: false,
        selectable: false,
        data: {
          target: {
            parentId: branchContainerNode?.id,
            sourceId: branchNode.id,
            sourceHandle,
            targetId: existingEdge?.target || null,
          },
          onAdd: onOpenInsert,
        },
      });
      branchDisplayEdges.push(
        createDisplayEdge(branchNode.id, addNodeId, sourceHandle),
      );

      if (existingEdge?.target) {
        const targetNode = allNodesById.get(existingEdge.target);
        if (targetNode) {
          laneBottom = Math.max(
            laneBottom,
            placeBranchChain(
              targetNode,
              laneCenterX,
              branchFirstChildY,
              addNodeId,
              nextVisited,
            ),
          );
        }
      }

      branchBottom = Math.max(branchBottom, laneBottom);
    });

    branchCaseTopsById.set(branchNode.id, caseTops);
    branchCaseHeightsById.set(branchNode.id, caseHeights);
    branchCaseLeftsById.set(branchNode.id, caseLefts);
    branchCaseWidthsById.set(branchNode.id, caseWidths);
    branchHeightById.set(
      branchNode.id,
      Math.max(branchMinHeight, branchBottom + branchBottomPadding),
    );
    branchLayoutDone.add(branchNode.id);
  }

  nodes
    .filter(
      (node) =>
        node.type === 'branch' &&
        !isScenarioDescendant(node) &&
        !isHiddenByCollapsedAncestor(node),
    )
    .forEach((branchNode) => layoutBranch(branchNode));

  const visibleTopLevelNodes = topLevelNodes.filter(
    (node) =>
      !branchEmbeddedNodeIds.has(node.id) && !isHiddenByCollapsedAncestor(node),
  );
  const nodesById = new Map(
    visibleTopLevelNodes.map((node) => [node.id, node]),
  );

  const measure = (nodeId: string | null, visited = new Set<string>()) => {
    if (!nodeId || visited.has(nodeId)) return nodeWidth;
    if (measured.has(nodeId)) return measured.get(nodeId) || nodeWidth;

    const node = allNodesById.get(nodeId);
    if (!node) return nodeWidth;

    if (node.type === 'branch') {
      layoutBranch(node, visited);
      const width = Math.max(
        branchWidthById.get(node.id) || nodeWidth,
        getNodeSize(node.id).width,
      );
      measured.set(nodeId, width);
      return width;
    }

    if (node.type === 'selectionGroup') {
      const estimated = estimateGroupDisplaySize(node);
      const width = Math.max(estimated.width, getNodeSize(node.id).width);

      measured.set(nodeId, width);
      return width;
    }

    const outgoingEdges = getOutgoingEdges(nodeId, edges);
    const handles = getBranchHandles(node);
    const laneTargetIds =
      handles.length > 1
        ? handles.map((handleId) => {
            const sourceHandle = normalizeSourceHandle(handleId);
            const existingEdge = outgoingEdges.find(
              (edge) =>
                normalizeSourceHandle(edge.sourceHandle) === sourceHandle,
            );

            return existingEdge?.target && nodesById.has(existingEdge.target)
              ? existingEdge.target
              : null;
          })
        : outgoingEdges
            .map((edge) => edge.target)
            .filter((targetId) => nodesById.has(targetId));

    if (laneTargetIds.length === 0) {
      const ownWidth = getNodeSize(nodeId).width;

      measured.set(nodeId, ownWidth);
      return ownWidth;
    }

    const nextVisited = new Set(visited);
    nextVisited.add(nodeId);
    const laneWidths = laneTargetIds.map((targetId) =>
      targetId ? measure(targetId, nextVisited) : nodeWidth,
    );
    const width = Math.max(
      getNodeSize(nodeId).width,
      laneWidths.reduce((sum, laneWidth) => sum + laneWidth, 0) +
        laneGapX * Math.max(0, laneWidths.length - 1),
    );

    measured.set(nodeId, width);
    return width;
  };

  const positioned = new Map<string, { x: number; y: number }>();

  const place = (
    nodeId: string | null,
    depth: number,
    centerX: number,
    visited = new Set<string>(),
  ) => {
    if (!nodeId || visited.has(nodeId)) return;
    if (!nodesById.has(nodeId)) return;

    const node = allNodesById.get(nodeId);
    if (!node) return;

    const size =
      node.type === 'branch'
        ? getBranchDisplaySize(nodeId)
        : node.type === 'selectionGroup'
          ? {
              width: Math.max(
                estimateGroupDisplaySize(node).width,
                getNodeSize(nodeId).width,
              ),
              height: Math.max(
                estimateGroupDisplaySize(node).height,
                getNodeSize(nodeId).height,
              ),
            }
          : getNodeSize(nodeId);
    depthByNodeId.set(nodeId, depth);
    maxHeightByDepth.set(
      depth,
      Math.max(maxHeightByDepth.get(depth) || 0, size.height),
    );

    positioned.set(nodeId, {
      x: centerX - size.width / 2,
      y: 190,
    });

    const nextVisited = new Set(visited);
    nextVisited.add(nodeId);
    if (allNodesById.get(nodeId)?.type === 'branch') return;

    const outgoingEdges = getOutgoingEdges(nodeId, edges);
    const handles = getBranchHandles(node);
    const laneTargetIds =
      handles.length > 1
        ? handles.map((handleId) => {
            const sourceHandle = normalizeSourceHandle(handleId);
            const existingEdge = outgoingEdges.find(
              (edge) =>
                normalizeSourceHandle(edge.sourceHandle) === sourceHandle,
            );

            return existingEdge?.target &&
              nodesById.has(existingEdge.target) &&
              !nextVisited.has(existingEdge.target)
              ? existingEdge.target
              : null;
          })
        : outgoingEdges
            .map((edge) => edge.target)
            .filter(
              (targetId) =>
                nodesById.has(targetId) && !nextVisited.has(targetId),
            );
    const childWidths = laneTargetIds.map((targetId) =>
      targetId ? measure(targetId) : nodeWidth,
    );
    const totalWidth =
      childWidths.reduce((sum, width) => sum + width, 0) +
      laneGapX * Math.max(0, childWidths.length - 1);
    let nextX = centerX - totalWidth / 2;
    const hasVisibleChild = laneTargetIds.some(Boolean);

    if (node.type === 'api' && hasVisibleChild) {
      minGapToNextDepth.set(
        depth,
        Math.max(
          minGapToNextDepth.get(depth) || 0,
          size.height +
            edgeSegmentLength +
            addNodeSize +
            apiFanoutDropY +
            apiFanoutCurveRoom,
        ),
      );
    }

    laneTargetIds.forEach((targetId, index) => {
      const width = childWidths[index];
      if (targetId) {
        place(targetId, depth + 1, nextX + width / 2, nextVisited);
      }
      nextX += width + laneGapX;
    });
  };

  const rootWidth = Math.max(520, measure(startNode?.id || null));
  place(startNode?.id || null, 0, rootWidth / 2);
  const startSize = nodeSizes[START_NODE_ID] || { width: 230, height: 38 };

  const maxDepth = Math.max(0, ...Array.from(depthByNodeId.values()));
  const yByDepth = new Map<number, number>();
  let nextY = 32 + startSize.height + verticalGap;

  for (let depth = 0; depth <= maxDepth; depth += 1) {
    yByDepth.set(depth, nextY);
    nextY += Math.max(
      (maxHeightByDepth.get(depth) || defaultNodeHeight) + verticalGap,
      minGapToNextDepth.get(depth) || 0,
    );
  }

  positioned.forEach((position, nodeId) => {
    const depth = depthByNodeId.get(nodeId) || 0;

    positioned.set(nodeId, {
      x: position.x,
      y: yByDepth.get(depth) || 190,
    });
  });

  const groupChildPositioned = new Map<string, { x: number; y: number }>();
  const groupChildAddNodes: Node<AddNodeData>[] = [];
  const groupChildEdges: BuilderEdge[] = [];
  const groupHeightById = new Map<string, number>();
  const groupWidthById = new Map<string, number>();
  const groupLayoutDone = new Set<string>();
  const groupMinWidth = 800;
  const groupMinHeight = 260;
  const groupPaddingX = 36;
  const groupFirstAddY = 96;
  const groupFirstChildY = 150;

  const getDisplayNodeSize = (node: BuilderNode): NodeSize => {
    if (
      node.type === 'selectionGroup' ||
      node.type === 'group' ||
      node.type === 'groupNode'
    ) {
      layoutGroup(node);
      return {
        width: groupWidthById.get(node.id) || getNodeSize(node.id).width,
        height: groupHeightById.get(node.id) || getNodeSize(node.id).height,
      };
    }

    if (node.type === 'branch') {
      layoutBranch(node);
      return getBranchDisplaySize(node.id);
    }

    if (node.type === 'scenario') {
      layoutScenarioChildren(node);
      return getNodeSize(node.id);
    }

    return getNodeSize(node.id);
  };

  const layoutGroup = (groupNode: BuilderNode, visited = new Set<string>()) => {
    if (groupLayoutDone.has(groupNode.id) || visited.has(groupNode.id)) return;

    const isBranchEmbeddedGroup = branchEmbeddedNodeIds.has(groupNode.id);
    const groupBaseWidth = isBranchEmbeddedGroup
      ? Math.max(
          getNodeSize(groupNode.id).width,
          branchEmbeddedGroupWidthById.get(groupNode.id) ||
            branchEmbeddedGroupWidth,
        )
      : groupMinWidth;
    const groupBaseHeight = isBranchEmbeddedGroup
      ? Math.max(
          groupMinHeight,
          branchEmbeddedGroupHeightById.get(groupNode.id) || groupMinHeight,
        )
      : groupMinHeight;

    if (isCollapsedGroup(groupNode)) {
      groupWidthById.set(
        groupNode.id,
        Math.max(groupBaseWidth, getNodeSize(groupNode.id).width),
      );
      groupHeightById.set(groupNode.id, collapsedGroupHeight);
      groupLayoutDone.add(groupNode.id);
      return;
    }

    const nextVisited = new Set(visited);
    nextVisited.add(groupNode.id);

    const groupChildren = nodes
      .filter(
        (node) =>
          node.parentNode === groupNode.id &&
          !branchEmbeddedNodeIds.has(node.id) &&
          !isHiddenByCollapsedAncestor(node),
      )
      .slice()
      .sort((a, b) => (a.position?.y || 0) - (b.position?.y || 0));

    groupChildren
      .filter(
        (childNode) =>
          childNode.type === 'selectionGroup' ||
          childNode.type === 'group' ||
          childNode.type === 'groupNode',
      )
      .forEach((childGroup) => layoutGroup(childGroup, nextVisited));

    const groupChildIds = new Set(groupChildren.map((child) => child.id));
    const groupEdges = edges.filter(
      (edge) =>
        groupChildIds.has(edge.source) && groupChildIds.has(edge.target),
    );
    const groupEntryChildren = groupChildren.filter(
      (childNode) => !groupEdges.some((edge) => edge.target === childNode.id),
    );
    const groupRoots =
      groupEntryChildren.length > 0
        ? groupEntryChildren
        : groupChildren.slice(0, 1);
    const groupMeasureCache = new Map<string, number>();

    const measureGroupSubtree = (
      nodeId: string,
      visitedSubtree = new Set<string>(),
    ): number => {
      if (visitedSubtree.has(nodeId)) return nodeWidth;
      if (groupMeasureCache.has(nodeId)) {
        return groupMeasureCache.get(nodeId) || nodeWidth;
      }

      const node = allNodesById.get(nodeId);
      if (!node) return nodeWidth;

      if (node.type === 'branch') {
        const width = getDisplayNodeSize(node).width;
        groupMeasureCache.set(nodeId, width);
        return width;
      }

      const handles = getBranchHandles(node);
      const outgoingByHandle = handles.map((handleId) => {
        const sourceHandle = normalizeSourceHandle(handleId);
        return groupEdges.find(
          (edge) =>
            edge.source === nodeId &&
            normalizeSourceHandle(edge.sourceHandle) === sourceHandle,
        );
      });
      const nextVisitedSubtree = new Set(visitedSubtree);
      nextVisitedSubtree.add(nodeId);
      const childWidths = outgoingByHandle.map((edge) =>
        edge?.target
          ? measureGroupSubtree(edge.target, nextVisitedSubtree)
          : nodeWidth,
      );
      const childLaneWidth =
        childWidths.reduce((sum, width) => sum + width, 0) +
        laneGapX * Math.max(0, childWidths.length - 1);
      const width = Math.max(getDisplayNodeSize(node).width, childLaneWidth);

      groupMeasureCache.set(nodeId, width);
      return width;
    };

    const rootWidths = groupRoots.map((root) => measureGroupSubtree(root.id));
    const groupWidth = Math.max(
      groupBaseWidth,
      rootWidths.reduce((sum, width) => sum + width, 0) +
        laneGapX * Math.max(0, rootWidths.length - 1) +
        groupPaddingX * 2,
    );
    const firstAddNodeId = `__flow_uipath_group_add__${groupNode.id}__start`;
    let contentBottom = groupFirstAddY + addNodeSize;

    groupWidthById.set(groupNode.id, groupWidth);

    groupChildAddNodes.push({
      id: firstAddNodeId,
      type: 'add',
      parentNode: groupNode.id,
      extent: 'parent',
      position: {
        x: groupWidth / 2 - addNodeSize / 2,
        y: groupFirstAddY,
      },
      draggable: false,
      selectable: false,
      data: {
        target: { parentId: groupNode.id },
        onAdd: onOpenInsert,
      },
    });

    const placeGroupSubtree = (
      childNode: BuilderNode,
      centerX: number,
      y: number,
      incomingAddNodeId: string,
      visitedSubtree = new Set<string>(),
      useIncomingFanoutEdge = false,
    ) => {
      if (visitedSubtree.has(childNode.id)) return;

      const childSize = getDisplayNodeSize(childNode);

      const childPosition = {
        x: Math.max(24, centerX - childSize.width / 2),
        y,
      };

      groupChildPositioned.set(childNode.id, childPosition);

      contentBottom = Math.max(contentBottom, y + childSize.height);
      groupChildEdges.push(
        useIncomingFanoutEdge
          ? createFanoutDisplayEdge(incomingAddNodeId, childNode.id)
          : createDisplayEdge(incomingAddNodeId, childNode.id),
      );

      if (childNode.type === 'branch') {
        return;
      }

      const handles = getBranchHandles(childNode);
      const nextVisitedSubtree = new Set(visitedSubtree);
      nextVisitedSubtree.add(childNode.id);
      const childBottom = y + childSize.height;
      const childWidths = handles.map((handleId) => {
        const sourceHandle = normalizeSourceHandle(handleId);
        const existingEdge = groupEdges.find(
          (edge) =>
            edge.source === childNode.id &&
            normalizeSourceHandle(edge.sourceHandle) === sourceHandle,
        );

        return existingEdge?.target
          ? measureGroupSubtree(existingEdge.target, nextVisitedSubtree)
          : nodeWidth;
      });
      const totalChildWidth =
        childWidths.reduce((sum, width) => sum + width, 0) +
        laneGapX * Math.max(0, childWidths.length - 1);
      let nextX = centerX - totalChildWidth / 2;

      handles.forEach((handleId, index) => {
        const sourceHandle = normalizeSourceHandle(handleId);
        const existingEdge = groupEdges.find(
          (edge) =>
            edge.source === childNode.id &&
            normalizeSourceHandle(edge.sourceHandle) === sourceHandle,
        );
        const laneWidth = childWidths[index];
        const laneCenterX = nextX + laneWidth / 2;
        const addNodeId = `__flow_uipath_group_add__${groupNode.id}__${childNode.id}__${handleId}`;

        groupChildAddNodes.push({
          id: addNodeId,
          type: 'add',
          parentNode: groupNode.id,
          extent: 'parent',
          position: {
            x: laneCenterX - addNodeSize / 2,
            y: childBottom + edgeSegmentLength,
          },
          draggable: false,
          selectable: false,
          data: {
            target: {
              parentId: groupNode.id,
              sourceId: childNode.id,
              sourceHandle,
            },
            onAdd: onOpenInsert,
          },
        });

        groupChildEdges.push(
          childNode.type === 'api'
            ? createFanoutDisplayEdge(childNode.id, addNodeId, sourceHandle)
            : createDisplayEdge(childNode.id, addNodeId, sourceHandle),
        );

        if (existingEdge?.target) {
          const targetNode = allNodesById.get(existingEdge.target);
          if (targetNode) {
            placeGroupSubtree(
              targetNode,
              laneCenterX,
              childBottom + verticalGap,
              addNodeId,
              nextVisitedSubtree,
              childNode.type === 'api',
            );
          }
        } else {
          contentBottom = Math.max(
            contentBottom,
            childBottom + edgeSegmentLength + addNodeSize,
          );
        }

        nextX += laneWidth + laneGapX;
      });
    };

    let rootX =
      groupWidth / 2 -
      (rootWidths.reduce((sum, width) => sum + width, 0) +
        laneGapX * Math.max(0, rootWidths.length - 1)) /
        2;

    groupRoots.forEach((root, index) => {
      const rootWidth = rootWidths[index];
      placeGroupSubtree(
        root,
        rootX + rootWidth / 2,
        groupFirstChildY,
        firstAddNodeId,
      );
      rootX += rootWidth + laneGapX;
    });

    groupChildren.forEach((childNode) => {
      if (!groupChildPositioned.has(childNode.id)) {
        placeGroupSubtree(
          childNode,
          groupWidth / 2,
          contentBottom + verticalGap,
          firstAddNodeId,
        );
      }
    });

    groupHeightById.set(
      groupNode.id,
      Math.max(groupBaseHeight, contentBottom + 56),
    );
    groupLayoutDone.add(groupNode.id);
  };

  nodes
    .filter(
      (node) =>
        node.type === 'selectionGroup' && !isHiddenByCollapsedAncestor(node),
    )
    .forEach((groupNode) => layoutGroup(groupNode));

  const scenarioChildEdges = edges
    .filter((edge) => {
      const sourceNode = allNodesById.get(edge.source);
      const targetNode = allNodesById.get(edge.target);
      if (!sourceNode?.parentNode || !targetNode?.parentNode) return false;
      if (sourceNode.parentNode !== targetNode.parentNode) return false;
      if (
        isHiddenByCollapsedAncestor(sourceNode) ||
        isHiddenByCollapsedAncestor(targetNode)
      ) {
        return false;
      }

      return allNodesById.get(sourceNode.parentNode)?.type === 'scenario';
    })
    .map((edge) => ({
      ...createDisplayEdge(edge.source, edge.target, edge.sourceHandle),
      zIndex: 1001,
    }));

  branchAddNodes.forEach((addNode) => {
    const target = addNode.data?.target;
    const sourceNode = target?.sourceId
      ? allNodesById.get(target.sourceId)
      : null;

    if (sourceNode?.type !== 'selectionGroup') return;
    if (!addNode.parentNode || sourceNode.parentNode === addNode.parentNode) {
      return;
    }

    const groupPosition = branchChildPositioned.get(sourceNode.id);
    if (!groupPosition) return;

    const groupHeight =
      groupHeightById.get(sourceNode.id) ||
      branchEmbeddedGroupHeightById.get(sourceNode.id) ||
      getNodeSize(sourceNode.id).height;
    const nextY = groupPosition.y + groupHeight + edgeSegmentLength;

    addNode.position = {
      ...addNode.position,
      y: nextY,
    };

    branchHeightById.set(
      addNode.parentNode,
      Math.max(
        branchHeightById.get(addNode.parentNode) || branchMinHeight,
        nextY + addNodeSize + branchBottomPadding,
      ),
    );
  });

  const realDisplayNodeIds = new Set(
    nodes
      .filter((node) => !isHiddenByCollapsedAncestor(node))
      .map((node) => node.id),
  );
  const canUseDisplayParent = (nodeId: string, parentId?: string | null) =>
    !!parentId && realDisplayNodeIds.has(parentId) && parentId !== nodeId;
  const getBranchChildDisplayPosition = (
    node: BuilderNode,
    visited = new Set<string>(),
  ): { x: number; y: number } | null => {
    if (visited.has(node.id)) return null;

    const branchPosition = branchChildPositioned.get(node.id);
    const branchParentId = branchChildParentById.get(node.id);

    if (!branchPosition || !branchParentId) return null;
    if (!node.parentNode || node.parentNode === branchParentId) {
      return branchPosition;
    }

    const nextVisited = new Set(visited);
    nextVisited.add(node.id);
    const parentBranchNode = allNodesById.get(branchParentId);
    const parentBranchPosition: { x: number; y: number } | undefined | null =
      (parentBranchNode
        ? getBranchChildDisplayPosition(parentBranchNode, nextVisited)
        : null) ||
      groupChildPositioned.get(branchParentId) ||
      scenarioChildPositioned.get(branchParentId) ||
      positioned.get(branchParentId) ||
      allNodesById.get(branchParentId)?.position;

    if (!parentBranchPosition) return branchPosition;

    return {
      x: parentBranchPosition.x + branchPosition.x,
      y: parentBranchPosition.y + branchPosition.y,
    };
  };

  const displayNodes: Node[] = [
    {
      id: START_NODE_ID,
      type: 'start',
      position: { x: rootWidth / 2 - 27, y: 32 },
      draggable: false,
      selectable: false,
      data: {},
    },
    {
      id: START_ADD_NODE_ID,
      type: 'add',
      position: {
        x: rootWidth / 2 - addNodeSize / 2,
        y: 32 + startSize.height + edgeSegmentLength,
      },
      draggable: false,
      selectable: false,
      data: {
        target: { sourceId: null, targetId: startNode?.id || null },
        onAdd: onOpenInsert,
      },
    },
    ...nodes
      .filter((node) => !isHiddenByCollapsedAncestor(node))
      .map((node) => ({
        ...node,
        data:
          node.type === 'selectionGroup'
            ? {
                ...node.data,
                onAddGroupNode: (groupId: string) =>
                  onOpenInsert({ parentId: groupId }),
                flowGroupHeight:
                  groupHeightById.get(node.id) ||
                  branchEmbeddedGroupHeightById.get(node.id),
                flowGroupWidth:
                  groupWidthById.get(node.id) ||
                  branchEmbeddedGroupWidthById.get(node.id),
              }
            : node.type === 'scenario'
              ? (() => {
                  const scenarioData = (node.data || {}) as Record<
                    string,
                    unknown
                  >;
                  const scenarioStyle = (node.style || {}) as Record<
                    string,
                    unknown
                  >;

                  return {
                    ...node.data,
                    flowScenarioHeight:
                      scenarioHeightById.get(node.id) ||
                      scenarioData.flowScenarioHeight ||
                      scenarioStyle.height,
                    flowScenarioWidth:
                      scenarioWidthById.get(node.id) ||
                      scenarioData.flowScenarioWidth ||
                      scenarioStyle.width,
                  };
                })()
              : node.type === 'branch'
                ? {
                    ...node.data,
                    flowBranchHeight: branchHeightById.get(node.id),
                    flowBranchCaseTops: branchCaseTopsById.get(node.id),
                    flowBranchCaseHeights: branchCaseHeightsById.get(node.id),
                    flowBranchCaseLefts: branchCaseLeftsById.get(node.id),
                    flowBranchCaseWidths: branchCaseWidthsById.get(node.id),
                    flowBranchSummaryHeight: branchSummaryHeightById.get(
                      node.id,
                    ),
                    flowBranchWidth: branchWidthById.get(node.id),
                  }
                : node.data,
        parentNode: canUseDisplayParent(node.id, node.parentNode)
          ? node.parentNode
          : canUseDisplayParent(node.id, branchChildParentById.get(node.id))
            ? branchChildParentById.get(node.id)
            : undefined,
        extent:
          canUseDisplayParent(node.id, node.parentNode) ||
          canUseDisplayParent(node.id, branchChildParentById.get(node.id))
            ? ('parent' as const)
            : undefined,
        position: getBranchChildDisplayPosition(node) ||
          scenarioChildPositioned.get(node.id) ||
          groupChildPositioned.get(node.id) ||
          positioned.get(node.id) ||
          node.position || { x: 0, y: 190 },
        draggable: false,
      })),
    ...groupChildAddNodes,
    ...branchAddNodes,
  ];

  const displayEdges: BuilderEdge[] = [
    createDisplayEdge(START_NODE_ID, START_ADD_NODE_ID),
  ];

  if (startNode) {
    displayEdges.push(createDisplayEdge(START_ADD_NODE_ID, startNode.id));
  }

  displayEdges.push(...groupChildEdges);
  displayEdges.push(...scenarioChildEdges);
  displayEdges.push(...branchDisplayEdges);

  topLevelNodes.forEach((node) => {
    if (
      branchEmbeddedNodeIds.has(node.id) ||
      isHiddenByCollapsedAncestor(node) ||
      node.type === 'branch'
    ) {
      return;
    }

    const handles = getBranchHandles(node);
    const existingEdges = getOutgoingEdges(node.id, edges);
    const nodeSize =
      node.type === 'selectionGroup'
        ? getDisplayNodeSize(node)
        : getNodeSize(node.id);

    handles.forEach((handleId, index) => {
      const sourceHandle = normalizeSourceHandle(handleId);
      const existingEdge = existingEdges.find(
        (edge) => normalizeSourceHandle(edge.sourceHandle) === sourceHandle,
      );
      const nodePosition = positioned.get(node.id) || node.position;
      const addNodeId = `__flow_uipath_add__${node.id}__${handleId}`;
      const offset =
        node.type === 'api'
          ? getApiHandleRatio(handleId) * nodeSize.width - nodeSize.width / 2
          : node.type === 'branch'
            ? ((index + 1) / (handles.length + 1)) * nodeSize.width -
              nodeSize.width / 2
            : 0;

      displayNodes.push({
        id: addNodeId,
        type: 'add',
        position: {
          x:
            (nodePosition?.x || 0) +
            nodeSize.width / 2 -
            addNodeSize / 2 +
            offset,
          y: (nodePosition?.y || 0) + nodeSize.height + edgeSegmentLength,
        },
        draggable: false,
        selectable: false,
        data: {
          target: {
            sourceId: node.id,
            sourceHandle,
            targetId: existingEdge?.target || null,
          },
          onAdd: onOpenInsert,
        },
      });

      displayEdges.push(createDisplayEdge(node.id, addNodeId, sourceHandle));
      if (existingEdge?.target) {
        displayEdges.push(
          node.type === 'api'
            ? createFanoutDisplayEdge(addNodeId, existingEdge.target)
            : createDisplayEdge(addNodeId, existingEdge.target),
        );
      }
    });
  });

  const terminalAddNodes = displayNodes.filter(
    (node): node is Node<AddNodeData> => {
      if (node.type !== 'add') return false;
      if (displayEdges.some((edge) => edge.source === node.id)) return false;
      if (!startNode && node.id === START_ADD_NODE_ID) return true;

      const target = (node.data as AddNodeData | undefined)?.target;
      if (!target?.sourceId) return false;

      const sourceNode = allNodesById.get(target.sourceId);
      const containerNode = getAncestorContainer(node);
      const sourceContainerNode = getAncestorContainer(sourceNode);
      const isContainerInternalAdd =
        !!containerNode &&
        !!sourceContainerNode &&
        containerNode.id === sourceContainerNode.id;
      const isSourceInsideContainerTerminal =
        !!sourceNode &&
        !!sourceContainerNode &&
        sourceNode.id !== sourceContainerNode.id &&
        !target.targetId;

      // 그룹 내부에 있는 브랜치의 부모 노드인 경우, 해당 노드는 터미널 Add 노드로 간주하지 않음 - hyh
      return !isContainerInternalAdd && !isSourceInsideContainerTerminal;
    },
  );
  const displayNodeById = new Map(displayNodes.map((node) => [node.id, node]));
  const getDisplayNodeHeight = (node: Node) => {
    const data = node.data as {
      flowBranchHeight?: number;
      flowGroupHeight?: number;
    };

    if (typeof node.height === 'number') return node.height;
    if (typeof node.style?.height === 'number') return node.style.height;
    if (node.type === 'add') return addNodeSize;
    if (node.type === 'start') return 54;
    if (node.type === 'branch')
      return data?.flowBranchHeight || defaultNodeHeight;
    if (node.type === 'selectionGroup') {
      return data?.flowGroupHeight || defaultNodeHeight;
    }

    return defaultNodeHeight;
  };
  const getAbsoluteNodePosition = (
    node: Node,
    visited = new Set<string>(),
  ): { x: number; y: number } => {
    const position = node.position || { x: 0, y: 0 };

    if (!node.parentNode || visited.has(node.id)) return position;

    const parentNode = displayNodeById.get(node.parentNode);
    if (!parentNode) return position;

    const nextVisited = new Set(visited);
    nextVisited.add(node.id);
    const parentPosition = getAbsoluteNodePosition(parentNode, nextVisited);

    return {
      x: parentPosition.x + position.x,
      y: parentPosition.y + position.y,
    };
  };
  const bottomY = displayNodes.reduce((maxY, node) => {
    const position = getAbsoluteNodePosition(node);

    return Math.max(maxY, position.y + getDisplayNodeHeight(node));
  }, 32);
  const terminalAddNodesWithPosition = terminalAddNodes.map((node) => ({
    node,
    position: getAbsoluteNodePosition(node),
  }));
  const endConnectionAddNodes = terminalAddNodesWithPosition.map(
    (item) => item.node,
  );
  const terminalCenterX =
    endConnectionAddNodes.length > 0
      ? endConnectionAddNodes.reduce((sum, node) => {
          const position = getAbsoluteNodePosition(node);

          return sum + position.x + addNodeSize / 2;
        }, 0) / endConnectionAddNodes.length
      : rootWidth / 2;
  const shouldUseEndMerge = endConnectionAddNodes.length > 1;
  const endY = bottomY + verticalGap;

  displayNodes.push({
    id: END_NODE_ID,
    type: 'end',
    position: { x: terminalCenterX - 27, y: endY },
    draggable: false,
    selectable: false,
    data: {},
  });

  endConnectionAddNodes.forEach((addNode) => {
    displayEdges.push(
      shouldUseEndMerge
        ? createEndDisplayEdge(addNode.id, END_NODE_ID)
        : createDisplayEdge(addNode.id, END_NODE_ID),
    );
  });

  const displayNodeIds = new Set(displayNodes.map((node) => node.id));
  const visibleDisplayEdges = displayEdges.filter(
    (edge) =>
      displayNodeIds.has(edge.source) && displayNodeIds.has(edge.target),
  );

  return { displayNodes, displayEdges: visibleDisplayEdges };
};
