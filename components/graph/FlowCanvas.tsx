import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ReactFlow,
  Background,
  Controls,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  Connection,
  ConnectionLineType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Box, useMediaQuery, useTheme } from '@mui/material';

import BusinessNodeComponent, { BusinessNode } from './CustomNodes';
import { useAutoLayout } from './useAutoLayout';
import { useGraphStyles, getNodePrefix } from './useGraphStyles';
import { edgeTypes } from './edges/BPMNEdge';
import FlowToolbar from './panels/FlowToolbar';
import FlowLegend from './panels/FlowLegend';
import NodeContextMenu from './menus/NodeContextMenu';
import EdgeContextMenu from './menus/EdgeContextMenu';
import LLMPipelineDialog from './LLMPipelineDialog';
import MappingRuleDefinitionsDialog from './MappingRuleDefinitionsDialog';

import { graphService } from '@/lib/api/services';
import useAlert from '@/lib/hooks/useAlert';
import type { VisualizationDataRes, NodeLevel } from '@/lib/types/graph';
import { useGraphStore } from './store/useGraphStore';

const nodeTypes = new Proxy(
  {} as Record<string, typeof BusinessNodeComponent>,
  {
    get: (_target, prop) => {
      if (typeof prop === 'symbol') return undefined;
      return BusinessNodeComponent;
    },
  },
);

interface FlowCanvasProps {
  onNodeSelect: (
    node: Node | null,
    tab?: 'info' | 'chunks' | 'edit' | null,
  ) => void;
  onNodeCtrlClick?: (node: Node) => void;
  visualizationData: VisualizationDataRes | null;
  onRefresh: () => Promise<void>;
  isDataLoading: boolean;
  checkedNodeIds: Set<string>;
  allTreeNodeIds: Set<string>;
  mode?: 'main' | 'popup';
}

export const EdgeMenuContext = React.createContext<
  ((event: React.MouseEvent, edgeId: string) => void) | null
>(null);

const FlowCanvas = ({
  onNodeSelect,
  onNodeCtrlClick,
  visualizationData,
  onRefresh,
  isDataLoading,
  checkedNodeIds,
  allTreeNodeIds,
  mode,
}: FlowCanvasProps) => {
  const { t } = useTranslation();
  const { showSnackbar } = useAlert();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Graph styles from Zustand store (populated once by GraphEditor on mount)
  const { nodeTypeStyles, edgeStyles, getEdgeStyle } = useGraphStyles();

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const { onLayout } = useAutoLayout();
  const { fitView, getNodes, getEdges, screenToFlowPosition } = useReactFlow();
  const [isLoading, setIsLoading] = useState(false);

  // Zustand Store selectors (Lightweight to prevent re-renders on node drag)
  const activeEdgeType = useGraphStore((state) => state.activeEdgeType);
  const currentTool = useGraphStore((state) => state.currentTool);
  const mappingRules = useGraphStore((state) => state.mappingRules);
  const isRulesModalOpen = useGraphStore((state) => state.isRulesModalOpen);
  const setRulesModalOpen = useGraphStore((state) => state.setRulesModalOpen);

  const trackNodeAdded = useGraphStore((state) => state.trackNodeAdded);
  const trackNodeDeleted = useGraphStore((state) => state.trackNodeDeleted);
  const trackEdgeAdded = useGraphStore((state) => state.trackEdgeAdded);
  const trackEdgeDeleted = useGraphStore((state) => state.trackEdgeDeleted);
  const trackEdgeModified = useGraphStore((state) => state.trackEdgeModified);
  const clearChanges = useGraphStore((state) => state.clearChanges);
  const popupSelectedNodes = useGraphStore((state) => state.popupSelectedNodes);

  // Dialog states
  const [isExecutionModalOpen, setIsExecutionModalOpen] = useState(false);
  const [executionStep, setExecutionStep] = useState<number>(0);

  // Edge context menu state
  const [edgeMenuPosition, setEdgeMenuPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

  // Node context menu state
  const [nodeMenuPosition, setNodeMenuPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [contextNode, setContextNode] = useState<Node | null>(null);

  // ─── Edge highlight logic ───────────────────────────────────

  const handleOpenEdgeMenu = useCallback(
    (event: React.MouseEvent, edgeId: string) => {
      if (mode === 'popup') return;
      setEdgeMenuPosition({ top: event.clientY, left: event.clientX });
      setSelectedEdgeId(edgeId);
    },
    [mode],
  );

  // edgesWithHighlight is removed to avoid cloning edges and causing unnecessary re-renders.
  // Instead, the original edges are passed to ReactFlow, and menu open handler is accessed via EdgeMenuContext.

  // ─── Node context menu handlers ─────────────────────────────

  const handleNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault();
      if (mode === 'popup') return;
      setNodeMenuPosition({ top: event.clientY, left: event.clientX });
      setContextNode(node);
      onNodeSelect(node, undefined);
    },
    [onNodeSelect, mode],
  );

  const handleCloseNodeMenu = useCallback(() => {
    setNodeMenuPosition(null);
    setContextNode(null);
  }, []);

  const handleCloseEdgeMenu = useCallback(() => {
    setEdgeMenuPosition(null);
    setSelectedEdgeId(null);
  }, []);

  const handleEditNode = useCallback(() => {
    if (contextNode) onNodeSelect(contextNode, 'edit');
    handleCloseNodeMenu();
  }, [contextNode, onNodeSelect, handleCloseNodeMenu]);

  const handleAddChildNode = useCallback(() => {
    if (!contextNode) return;
    const childLevel = 'L3';
    const prefix = getNodePrefix(childLevel);
    const style = nodeTypeStyles[prefix] ||
      nodeTypeStyles['Default'] || {
        bg: '#ffffff',
        border: '2px solid #dde1f0',
      };
    const id = `n-${Date.now()}`;
    const newNode: Node = {
      id,
      type: prefix || 'Default',
      position: { x: contextNode.position.x + 250, y: contextNode.position.y },
      data: {
        label: 'New Node',
        type: childLevel,
        desc: '',
        nodeBgColor: style.bg,
        nodeBorder: style.border,
        nodeColor: style.color,
      },
    };

    const sourceLevel = (contextNode as BusinessNode).data.type || 'L1';
    const targetLevel = childLevel; // L3
    const styleConfig = getEdgeStyle(activeEdgeType, sourceLevel, targetLevel);
    const newEdge: Edge = {
      id: `e-${contextNode.id}-${id}`,
      source: contextNode.id,
      target: id,
      ...styleConfig,
      label: activeEdgeType,
    };

    setNodes((nds) => nds.concat(newNode));
    setEdges((eds) => eds.concat(newEdge));

    // Track locally
    trackNodeAdded(newNode);
    trackEdgeAdded(newEdge);

    handleCloseNodeMenu();
  }, [
    contextNode,
    activeEdgeType,
    setNodes,
    setEdges,
    nodeTypeStyles,
    getEdgeStyle,
    trackNodeAdded,
    trackEdgeAdded,
    handleCloseNodeMenu,
  ]);

  const handleDeleteNode = useCallback(() => {
    if (!contextNode) return;
    const currentEdges = getEdges();
    const connectedEdges = currentEdges.filter(
      (e) => e.source === contextNode.id || e.target === contextNode.id,
    );
    const connectedEdgeIds = connectedEdges.map((e) => e.id);

    setNodes((nds) => nds.filter((n) => n.id !== contextNode.id));
    setEdges((eds) =>
      eds.filter(
        (e) => e.source !== contextNode.id && e.target !== contextNode.id,
      ),
    );

    // Track locally
    trackNodeDeleted(contextNode.id, connectedEdgeIds);

    onNodeSelect(null, undefined);
    handleCloseNodeMenu();
  }, [
    contextNode,
    getEdges,
    setNodes,
    setEdges,
    onNodeSelect,
    trackNodeDeleted,
    handleCloseNodeMenu,
  ]);

  // ─── Keyboard/Interactive Deletions ─────────────────────────────────

  const handleNodesDelete = useCallback(
    (nodesToDelete: Node[]) => {
      nodesToDelete.forEach((node) => {
        const currentEdges = getEdges();
        const connectedEdges = currentEdges.filter(
          (e) => e.source === node.id || e.target === node.id,
        );
        const connectedEdgeIds = connectedEdges.map((e) => e.id);
        trackNodeDeleted(node.id, connectedEdgeIds);
      });
    },
    [getEdges, trackNodeDeleted],
  );

  const handleEdgesDelete = useCallback(
    (edgesToDelete: Edge[]) => {
      edgesToDelete.forEach((edge) => {
        trackEdgeDeleted(edge.id);
      });
    },
    [trackEdgeDeleted],
  );

  // ─── Edge type change ───────────────────────────────────────

  const handleChangeEdgeType = useCallback(
    (type: string) => {
      if (!selectedEdgeId) return;
      const currentEdges = getEdges();
      const currentNodes = getNodes();
      const edge = currentEdges.find((e) => e.id === selectedEdgeId);
      let sourceLevel: string | undefined;
      let targetLevel: string | undefined;

      if (edge) {
        const sourceNode = currentNodes.find((n) => n.id === edge.source) as
          BusinessNode | undefined;
        const targetNode = currentNodes.find((n) => n.id === edge.target) as
          BusinessNode | undefined;
        sourceLevel = sourceNode?.data?.type;
        targetLevel = targetNode?.data?.type;
      }

      const styleConfig = getEdgeStyle(type, sourceLevel, targetLevel);
      setEdges((eds) =>
        eds.map((e) =>
          e.id === selectedEdgeId ? { ...e, ...styleConfig, label: type } : e,
        ),
      );

      // Track locally
      trackEdgeModified(selectedEdgeId, { label: type });

      handleCloseEdgeMenu();
    },
    [
      selectedEdgeId,
      getEdgeStyle,
      setEdges,
      trackEdgeModified,
      handleCloseEdgeMenu,
      getEdges,
      getNodes,
    ],
  );

  // ─── Core actions ───────────────────────────────────────────

  const handleSave = useCallback(async () => {
    const changes = useGraphStore.getState().localChanges;

    if (
      changes.addedNodes.length === 0 &&
      changes.modifiedNodes.size === 0 &&
      changes.deletedNodeIds.size === 0 &&
      changes.addedEdges.length === 0 &&
      changes.modifiedEdges.size === 0 &&
      changes.deletedEdgeIds.size === 0
    ) {
      showSnackbar('info', t('No changes to save.'));
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        addedNodes: changes.addedNodes.map((n) => ({
          id: n.id,
          label: (n.type as NodeLevel) || 'L4',
          properties: {
            name: n.data.label as string,
            desc: (n.data.desc || '') as string,
          },
        })),
        modifiedNodes: Array.from(changes.modifiedNodes.entries()).map(
          ([id, props]) => {
            const originalNode = visualizationData?.nodes.find(
              (n) => n.id === id,
            );
            const { type, name, desc, label: propLabel, ...otherProps } = props;

            const finalName =
              name || propLabel || originalNode?.properties?.name;
            const finalDesc =
              desc !== undefined ? desc : originalNode?.properties?.desc;

            const properties = {
              ...(originalNode?.properties || {}),
              ...otherProps,
            };

            properties.name = finalName;
            if (finalDesc !== undefined) {
              properties.desc = finalDesc;
            }
            delete (properties as any).type;
            delete (properties as any).label;

            return {
              id,
              label: (type as NodeLevel) || originalNode?.label || 'L4',
              properties,
            };
          },
        ),
        deletedNodeIds: Array.from(changes.deletedNodeIds),
        addedEdges: changes.addedEdges.map((e) => ({
          source: e.source,
          target: e.target,
          label: (e.label as string) || 'INCLUDE',
        })),
        deletedEdgeIds: Array.from(changes.deletedEdgeIds),
        modifiedEdges: Array.from(changes.modifiedEdges.entries()).map(
          ([id, edgeData]) => ({
            id,
            label: edgeData.label || 'INCLUDE',
          }),
        ),
      };

      await graphService.saveGraphChanges(payload);
      console.log(payload);

      showSnackbar('success', t('Graph changes saved successfully!'));

      // Clear local changes and refresh data
      clearChanges();
      await onRefresh();
    } catch (error) {
      console.error('Failed to save graph changes:', error);
      showSnackbar(
        'error',
        t('Failed to save graph changes. Please try again.'),
      );
    } finally {
      setIsLoading(false);
    }
  }, [clearChanges, onRefresh, showSnackbar, t]);

  const handleExtract = useCallback(async () => {
    setIsLoading(true);
    try {
      await onRefresh();
    } catch (error) {
      console.error('Failed to refresh graph data:', error);
      showSnackbar(
        'info',
        t('Failed to refresh graph data. Please try again.'),
      );
    } finally {
      setIsLoading(false);
    }
  }, [onRefresh, showSnackbar, t]);

  const checkedNodesStr = React.useMemo(
    () => Array.from(checkedNodeIds).sort().join(','),
    [checkedNodeIds],
  );
  const allTreeNodesStr = React.useMemo(
    () => Array.from(allTreeNodeIds).sort().join(','),
    [allTreeNodeIds],
  );

  const fitViewOptions = useMemo(() => ({ padding: 0.2 }), []);

  // Layout and render graph nodes and edges whenever visualizationData changes or tree check filters change
  React.useEffect(() => {
    if (!visualizationData) return;
    console.log('[FlowCanvas] Layout useEffect triggered');

    // Read localChanges snapshot (not subscribed to avoid re-renders during drag)
    const localChanges = useGraphStore.getState().localChanges;

    // 1. Build a map of all edges to check connectivity of non-tree nodes (e.g. rules, chunks, elements)
    const nodeConnections: Record<string, string[]> = {};
    const activeApiEdges = visualizationData.edges.filter(
      (e) => !localChanges.deletedEdgeIds.has(e.id),
    );
    const allActiveEdges = [...activeApiEdges, ...localChanges.addedEdges];

    allActiveEdges.forEach((e) => {
      if (!nodeConnections[e.source]) nodeConnections[e.source] = [];
      if (!nodeConnections[e.target]) nodeConnections[e.target] = [];
      nodeConnections[e.source].push(e.target);
      nodeConnections[e.target].push(e.source);
    });

    // Helper to determine if a node should be visible
    const isNodeVisible = (nodeId: string) => {
      // If deleted, it's not visible
      if (localChanges.deletedNodeIds.has(nodeId)) return false;

      // If we don't have checked state loaded yet, show everything by default
      if (allTreeNodeIds.size === 0) return true;

      // If it exists in the tree, show it only if it is checked
      if (allTreeNodeIds.has(nodeId)) {
        return checkedNodeIds.has(nodeId);
      }

      // If it's a locally added node, it should be visible by default
      const isLocallyAdded = localChanges.addedNodes.some(
        (n) => n.id === nodeId,
      );
      if (isLocallyAdded) return true;

      // Show non-tree nodes by default without filtering orphan nodes
      return true;
    };

    // 2. Filter API nodes based on tree checked state and deletions
    const activeApiNodes = visualizationData.nodes.filter(
      (n) => !localChanges.deletedNodeIds.has(n.id),
    );
    const visibleApiNodes = activeApiNodes.filter((n) => isNodeVisible(n.id));

    // 3. Map API nodes to ReactFlow nodes
    const defaultStyle = nodeTypeStyles['L3'] || {
      bg: '#ffffff',
      border: '2px solid #dde1f0',
    };

    const mappedApiNodes: Node[] = visibleApiNodes.map((n) => {
      const rawType = n.label || '';
      const prefix = getNodePrefix(rawType);
      const style =
        nodeTypeStyles[prefix] || nodeTypeStyles['Default'] || defaultStyle;

      // Apply modifications if any
      const modifiedProps = localChanges.modifiedNodes.get(n.id) || {};
      const finalProperties = {
        ...n.properties,
        ...modifiedProps,
      };

      return {
        id: n.id,
        type: prefix || 'Default',
        data: {
          ...finalProperties,
          label: finalProperties.name || n.label,
          code: finalProperties.code || finalProperties.node_id || '',
          type: rawType,
          nodeBgColor: style.bg,
          nodeBorder: style.border,
          nodeColor: style.color,
          // isPickedNode is patched by a separate lightweight effect
          // to avoid triggering a full re-layout on every Ctrl+Click.
        },
        position: { x: Math.random() * 400, y: Math.random() * 400 },
      };
    });

    // 4. Map locally added nodes (they are always visible)
    const mappedAddedNodes: Node[] = localChanges.addedNodes.map((n) => {
      const rawType = n.type || 'L3';
      const prefix = getNodePrefix(rawType);
      const style =
        nodeTypeStyles[prefix] || nodeTypeStyles['Default'] || defaultStyle;
      return {
        ...n,
        type: prefix || 'Default',
        data: {
          ...n.data,
          type: rawType,
          nodeBgColor: style.bg,
          nodeBorder: style.border,
          nodeColor: style.color,
        },
      };
    });

    const newNodes = [...mappedApiNodes, ...mappedAddedNodes];
    const visibleNodeIds = new Set(newNodes.map((n) => n.id));

    // Optimize lookup of node types
    const nodeTypeMap = new Map<string, string>();
    (newNodes as BusinessNode[]).forEach((n) => {
      if (n.data?.type) {
        nodeTypeMap.set(n.id, n.data.type);
      }
    });

    // 5. Map edges, keeping only those connecting visible nodes
    const mappedApiEdges = activeApiEdges
      .filter(
        (e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target),
      )
      .map((e) => {
        const sourceLevel = nodeTypeMap.get(e.source);
        const targetLevel = nodeTypeMap.get(e.target);
        const edgeStyleConfig = getEdgeStyle(e.label, sourceLevel, targetLevel);
        const modifications = localChanges.modifiedEdges.get(e.id) || {};
        return {
          id: e.id,
          source: e.source,
          target: e.target,
          deletable: e.label !== 'INCLUDE',
          ...edgeStyleConfig,
          ...modifications,
        };
      });

    const mappedAddedEdges = localChanges.addedEdges
      .filter(
        (e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target),
      )
      .map((e) => {
        const sourceLevel = nodeTypeMap.get(e.source);
        const targetLevel = nodeTypeMap.get(e.target);
        const edgeStyleConfig = getEdgeStyle(
          (e.label as string) || 'INCLUDE',
          sourceLevel,
          targetLevel,
        );
        return {
          ...e,
          deletable: e.label !== 'INCLUDE',
          ...edgeStyleConfig,
        };
      });

    const rawNewEdges = [...mappedApiEdges, ...mappedAddedEdges];

    // Pre-calculate bidirectional cycles to optimize render performance during node drag
    const activePairs = new Set<string>();
    rawNewEdges.forEach((e) => {
      activePairs.add(`${e.source}->${e.target}`);
    });

    const newEdges = rawNewEdges.map((e) => {
      const hasCycle = activePairs.has(`${e.target}->${e.source}`);
      return {
        ...e,
        data: {
          ...e.data,
          isTwoNodeCycle: hasCycle,
        },
      };
    });

    const direction = isMobile ? 'TB' : 'LR';
    const { nodes: layoutedNodes, edges: layoutedEdges } = onLayout(
      newNodes,
      newEdges,
      direction,
    );

    setNodes(layoutedNodes as Node[]);
    setEdges(layoutedEdges);

    window.requestAnimationFrame(() => {
      fitView({ padding: 0.2, duration: 800 });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    visualizationData,
    checkedNodesStr,
    allTreeNodesStr,
    isMobile,
    onLayout,
    setNodes,
    setEdges,
    fitView,
    nodeTypeStyles,
    getEdgeStyle,
  ]);

  // Lightweight effect: patch isPickedNode in-place when popupSelectedNodes changes.
  // Deliberately separate from the layout effect to avoid full re-layout on every Ctrl+Click.
  React.useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => {
        const isPicked = popupSelectedNodes.has(n.id);
        // Skip update if the value hasn't changed to avoid unnecessary object creation
        if ((n.data as any).isPickedNode === isPicked) return n;
        return {
          ...n,
          data: { ...n.data, isPickedNode: isPicked },
        };
      }),
    );
  }, [popupSelectedNodes, setNodes]);

  const handleTwoStepExecution = useCallback(() => {
    setIsExecutionModalOpen(true);
    setExecutionStep(1);

    setTimeout(() => setExecutionStep(2), 1500);
    setTimeout(() => setExecutionStep(3), 3000);
    setTimeout(() => setExecutionStep(4), 4500);

    setTimeout(async () => {
      setIsExecutionModalOpen(false);
      setExecutionStep(0);
      await handleExtract();
      showSnackbar(
        'info',
        t('Two-step LLM Mapping Execution completed successfully!'),
      );
    }, 5500);
  }, [handleExtract, showSnackbar, t]);

  const handleCreateNode = useCallback(() => {
    setIsLoading(true);
    const id = `n-${Date.now()}`;
    const randomValue = Math.floor(Math.random() * 101) - 50;
    const position = screenToFlowPosition({
      x: window.innerWidth / 2 - 45 + randomValue,
      y: window.innerHeight / 2 - 23 + randomValue,
    });
    const newLevel = 'L3';
    const prefix = getNodePrefix(newLevel);
    const style = nodeTypeStyles[prefix] ||
      nodeTypeStyles['Default'] || {
        bg: '#ffffff',
        border: '2px solid #dde1f0',
      };
    const newNode: Node = {
      id,
      type: prefix || 'Default',
      data: {
        label: 'New Node',
        type: newLevel,
        desc: '',
        nodeBgColor: style.bg,
        nodeBorder: style.border,
        nodeColor: style.color,
      },
      position,
    };

    requestAnimationFrame(() => {
      setNodes((nds) => nds.concat(newNode));
      trackNodeAdded(newNode);
      setIsLoading(false);
    });
  }, [setNodes, screenToFlowPosition, nodeTypeStyles, trackNodeAdded]);

  const isValidConnection = useCallback(
    (connection: Connection | Edge) => {
      const currentNodes = getNodes();
      const sourceNode = currentNodes.find(
        (n) => n.id === connection.source,
      ) as BusinessNode | undefined;
      const targetNode = currentNodes.find(
        (n) => n.id === connection.target,
      ) as BusinessNode | undefined;
      if (!sourceNode || !targetNode) return false;

      const sourceFullType = sourceNode.data.type || 'L1';
      const targetFullType = targetNode.data.type || 'L1';
      const sourcePrefix = getNodePrefix(sourceFullType);
      const targetPrefix = getNodePrefix(targetFullType);

      if (connection.source === connection.target) return false;

      return mappingRules.some(
        (rule) =>
          rule.edgeType !== 'INCLUDE' &&
          (rule.startingPointType === sourceFullType ||
            rule.startingPointType === sourcePrefix) &&
          (rule.destinationType === targetFullType ||
            rule.destinationType === targetPrefix),
      );
    },
    [getNodes, mappingRules],
  );

  const onConnect = useCallback(
    (params: Connection) => {
      const currentNodes = getNodes();
      const sourceNode = currentNodes.find((n) => n.id === params.source) as
        BusinessNode | undefined;
      const targetNode = currentNodes.find((n) => n.id === params.target) as
        BusinessNode | undefined;
      const sourceLevel = (sourceNode?.data?.type as string) || 'L1';
      const targetLevel = (targetNode?.data?.type as string) || 'L1';
      const sourcePrefix = getNodePrefix(sourceLevel);
      const targetPrefix = getNodePrefix(targetLevel);

      const matchedRule = mappingRules.find(
        (rule) =>
          rule.edgeType !== 'INCLUDE' &&
          (rule.startingPointType === sourceLevel ||
            rule.startingPointType === sourcePrefix) &&
          (rule.destinationType === targetLevel ||
            rule.destinationType === targetPrefix),
      );

      if (!matchedRule || typeof matchedRule.edgeType !== 'string') return;

      const newEdgeType = matchedRule.edgeType;

      const styleConfig = getEdgeStyle(newEdgeType, sourceLevel, targetLevel);
      const newEdge: Edge = {
        id: `e-${params.source}-${params.target}-${Date.now()}`,
        source: params.source,
        target: params.target,
        sourceHandle: params.sourceHandle,
        targetHandle: params.targetHandle,
        ...styleConfig,
        label: newEdgeType,
        animated: false,
      };

      setEdges((eds) => [...eds, newEdge]);
      trackEdgeAdded(newEdge);
    },
    [setEdges, mappingRules, getEdgeStyle, trackEdgeAdded, getNodes],
  );

  const handleLayout = useCallback(() => {
    const direction = isMobile ? 'TB' : 'LR';
    const currentNodes = getNodes();
    const currentEdges = getEdges();
    const { nodes: layoutedNodes, edges: layoutedEdges } = onLayout(
      currentNodes,
      currentEdges,
      direction,
    );
    setNodes(layoutedNodes as Node[]);
    setEdges(layoutedEdges);
  }, [getNodes, getEdges, onLayout, setNodes, setEdges, isMobile]);

  const handleOpenRules = useCallback(() => {
    setRulesModalOpen(true);
  }, [setRulesModalOpen]);

  const handleCloseRules = useCallback(() => {
    setRulesModalOpen(false);
  }, [setRulesModalOpen]);

  // ─── Click handlers ─────────────────────────────────────────

  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      if ((event.ctrlKey || event.metaKey) && onNodeCtrlClick) {
        // Ctrl+Click (or ⌘+Click on Mac): toggle node into/out of picked set
        onNodeCtrlClick(node);
      } else {
        // Normal click: single-select to view info in right sidebar
        setSelectedNodeId(node.id);
        onNodeSelect(node, undefined);
      }
    },
    [onNodeSelect, onNodeCtrlClick],
  );

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
    handleCloseNodeMenu();
    onNodeSelect(null, undefined);
  }, [onNodeSelect]);

  // Memoize connection line props to avoid new object references on every render
  const memoizedConnectionLineStyle = useMemo(
    () => getEdgeStyle(activeEdgeType).style,
    [getEdgeStyle, activeEdgeType],
  );

  const memoizedConnectionLineType = useMemo(
    () =>
      edgeStyles[activeEdgeType]?.pathType === 'CORNER'
        ? ConnectionLineType.SmoothStep
        : ConnectionLineType.Straight,
    [edgeStyles, activeEdgeType],
  );

  // Collect unique markers to render in defs
  const uniqueMarkers = useMemo(() => {
    const markers = new Map<string, { type: string; color: string }>();

    edges.forEach((edge) => {
      const edgeColor = edge.style?.stroke || '#111111';

      if (edge.markerStart && typeof edge.markerStart === 'string') {
        const id = edge.markerStart;
        const typeMatch = id.match(/^marker-([a-z]+)-/);
        if (typeMatch) {
          markers.set(id, {
            type: typeMatch[1].toUpperCase(),
            color: edgeColor,
          });
        }
      }

      if (edge.markerEnd && typeof edge.markerEnd === 'string') {
        const id = edge.markerEnd;
        const typeMatch = id.match(/^marker-([a-z]+)-/);
        if (typeMatch) {
          markers.set(id, {
            type: typeMatch[1].toUpperCase(),
            color: edgeColor,
          });
        }
      }
    });

    return Array.from(markers.entries()).map(([id, info]) => ({
      id,
      ...info,
    }));
  }, [edges]);

  const validEdgeTypes = useMemo(() => {
    if (!selectedEdgeId) return Object.keys(edgeStyles);

    const edge = edges.find((e) => e.id === selectedEdgeId);
    if (!edge) return Object.keys(edgeStyles);

    const sourceNode = nodes.find((n) => n.id === edge.source);
    const targetNode = nodes.find((n) => n.id === edge.target);
    if (!sourceNode || !targetNode) return Object.keys(edgeStyles);

    const sourceLevel = (sourceNode.data?.type as string) || 'L1';
    const targetLevel = (targetNode.data?.type as string) || 'L1';
    const sourcePrefix = getNodePrefix(sourceLevel);
    const targetPrefix = getNodePrefix(targetLevel);

    const matchingRules = mappingRules.filter(
      (rule) =>
        (rule.startingPointType === sourceLevel ||
          rule.startingPointType === sourcePrefix) &&
        (rule.destinationType === targetLevel ||
          rule.destinationType === targetPrefix),
    );

    if (matchingRules.length === 0) {
      return Object.keys(edgeStyles);
    }

    const validTypes = new Set(
      matchingRules
        .map((r) => r.edgeType)
        .filter((t): t is string => typeof t === 'string'),
    );
    return Array.from(validTypes);
  }, [selectedEdgeId, nodes, edges, mappingRules, edgeStyles]);

  // ─── Render ─────────────────────────────────────────────────

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        position: 'relative',
        ...(mode === 'popup' && {
          '& .react-flow__handle': {
            opacity: '0 !important',
            pointerEvents: 'none !important',
          },
          '& .edge-toolbar-actions': {
            display: 'none !important',
          },
        }),
      }}
    >
      <EdgeMenuContext.Provider value={handleOpenEdgeMenu}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodesConnectable={mode !== 'popup'}
          edgesReconnectable={mode !== 'popup'}
          onConnect={onConnect}
          onNodesDelete={handleNodesDelete}
          onEdgesDelete={handleEdgesDelete}
          isValidConnection={isValidConnection}
          onNodeClick={onNodeClick}
          onNodeContextMenu={handleNodeContextMenu}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          connectionLineStyle={memoizedConnectionLineStyle}
          connectionLineType={memoizedConnectionLineType}
          fitView
          fitViewOptions={fitViewOptions}
          panOnDrag={true}
          selectionOnDrag={currentTool === 'select'}
          selectionMode={currentTool === 'select' ? 'full' : ('partial' as any)}
          zoomOnScroll={true}
          panOnScroll={false}
        >
          <svg
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '1px',
              height: '1px',
              overflow: 'hidden',
              opacity: 0,
              pointerEvents: 'none',
            }}
          >
            <defs>
              {uniqueMarkers.map(({ id, type, color }) => {
                const refX = type === 'ARROW' ? 6 : 5;
                const markerWidth = 6;
                const markerHeight = 6;

                switch (type) {
                  case 'ARROW':
                    return (
                      <marker
                        key={id}
                        id={id}
                        viewBox="0 0 10 10"
                        refX={refX}
                        refY="5"
                        markerWidth={markerWidth}
                        markerHeight={markerHeight}
                        orient="auto-start-reverse"
                      >
                        <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
                      </marker>
                    );
                  case 'CIRCLE':
                    return (
                      <marker
                        key={id}
                        id={id}
                        viewBox="0 0 10 10"
                        refX={refX}
                        refY="5"
                        markerWidth={markerWidth}
                        markerHeight={markerHeight}
                        orient="auto"
                      >
                        <circle cx="5" cy="5" r="4" fill={color} />
                      </marker>
                    );
                  case 'SQUARE':
                    return (
                      <marker
                        key={id}
                        id={id}
                        viewBox="0 0 10 10"
                        refX={refX}
                        refY="5"
                        markerWidth={markerWidth}
                        markerHeight={markerHeight}
                        orient="auto"
                      >
                        <rect x="1" y="1" width="8" height="8" fill={color} />
                      </marker>
                    );
                  case 'RHOMBUS':
                    return (
                      <marker
                        key={id}
                        id={id}
                        viewBox="0 0 10 10"
                        refX={refX}
                        refY="5"
                        markerWidth={markerWidth}
                        markerHeight={markerHeight}
                        orient="auto"
                      >
                        <path d="M 5 0 L 10 5 L 5 10 L 0 5 Z" fill={color} />
                      </marker>
                    );
                  default:
                    return null;
                }
              })}
            </defs>
          </svg>

          <Background color="#f8fafc" gap={10} />
          <Controls position={isMobile ? 'bottom-right' : 'bottom-left'} />

          {/* Toolbar — mobile bottom bar or desktop top-right */}
          <FlowToolbar
            isMobile={isMobile}
            isLoading={isLoading}
            onLayout={handleLayout}
            onExecute={handleTwoStepExecution}
            onOpenRules={handleOpenRules}
            onCreateNode={handleCreateNode}
            onSave={handleSave}
            mode={mode}
          />
        </ReactFlow>
      </EdgeMenuContext.Provider>

      {/* Legend */}
      <FlowLegend nodeTypeStyles={nodeTypeStyles} mode={mode} />

      {/* Edge Context Menu */}
      {mode !== 'popup' && (
        <EdgeContextMenu
          position={edgeMenuPosition}
          edgeStyles={edgeStyles}
          validEdgeTypes={validEdgeTypes}
          onClose={handleCloseEdgeMenu}
          onChangeType={handleChangeEdgeType}
        />
      )}

      {/* Node Context Menu */}
      {mode !== 'popup' && (
        <NodeContextMenu
          position={nodeMenuPosition}
          onClose={handleCloseNodeMenu}
          onEdit={handleEditNode}
          onAddChild={handleAddChildNode}
          onConnect={handleCloseNodeMenu}
          onDelete={handleDeleteNode}
        />
      )}

      {/* Two-Step LLM Pipeline Processing Dialog */}
      <LLMPipelineDialog
        open={isExecutionModalOpen}
        executionStep={executionStep}
      />

      {/* Mapping Rule Definitions Dialog */}
      <MappingRuleDefinitionsDialog
        open={isRulesModalOpen}
        onClose={handleCloseRules}
      />
    </Box>
  );
};

export default React.memo(FlowCanvas);
