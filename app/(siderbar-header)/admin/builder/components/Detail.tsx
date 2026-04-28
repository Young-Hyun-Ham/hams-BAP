// app/(siderbar-header)/admin/builder/components/Detail.tsx
"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store';
import { useModal } from '@/providers/ModalProvider';
import * as utils from '@/lib/utils/utils';

import ReactFlow, { Controls, useReactFlow, MiniMap, Background, MarkerType, Panel, SelectionMode } from 'reactflow';
import 'reactflow/dist/style.css';

import useBuilderStore, { ALL_NODE_TYPES, makeSnapshot } from '../store/index';
import styles from './Detail.module.css';

import MessageNode from './nodes/MessageNode';
import BranchNode from './nodes/BranchNode';
import SlotFillingNode from './nodes/SlotFillingNode';
import ApiNode from './nodes/ApiNode';
import FormNode from './nodes/FormNode';
import FixedMenuNode from './nodes/FixedMenuNode';
import LinkNode from './nodes/LinkNode';
import LlmNode from './nodes/LlmNode';
import ToastNode from './nodes/ToastNode';
import IframeNode from './nodes/IframeNode';
import ScenarioNode from './nodes/ScenarioNode';
import SetSlotNode from './nodes/SetSlotNode';
import DelayNode from './nodes/DelayNode';
import GroupNode from './nodes/GroupNode';

import ScenarioGroupModal from './modals/ScenarioGroupModal';
import SlotDisplay from './SlotDisplay';
import NodeController from './NodeController';
import ChatbotSimulator from './ChatbotSimulator';
import { IconListBack, SettingsIcon } from './icons/Icons';
import LogPreview from './modals/LogPreview';

import '@reactflow/node-resizer/dist/style.css';

import CustomDraggableEdge from './edges/CustomDraggableEdge';
import CustomDraggableStepEdge from './edges/CustomDraggableStepEdge';
import CustomOrthogonalEdge from './edges/CustomOrthogonalEdge';

// 플레이(실행) 스토어
import { useBuilderExecution } from "./controllers/hooks/useBuilderExecution";
import { builderExecutionStore } from "../store/builderExecutionStore";
// 클립보드 스토어
import { builderClipboardStore } from "../store/builderClipboardStore";

import type { Edge, Node } from "reactflow";

const nodeTypes = {
  message: MessageNode,
  branch: BranchNode,
  slotfilling: SlotFillingNode,
  api: ApiNode,
  form: FormNode,
  fixedmenu: FixedMenuNode,
  link: LinkNode,
  llm: LlmNode,
  toast: ToastNode,
  iframe: IframeNode,
  scenario: ScenarioNode,
  setSlot: SetSlotNode,
  delay: DelayNode,
  selectionGroup: GroupNode,
};

const edgeTypes = {
  draggable: CustomDraggableEdge,
  draggableStep: CustomDraggableStepEdge,
  orthogonal: CustomOrthogonalEdge,
};

// 💡 [추가] 노드 레이블 매핑
const nodeLabels = {
  message: '+ Message',
  form: '+ Form',
  branch: '+ Condition Branch',
  slotfilling: '+ SlotFilling',
  api: '+ API',
  llm: '+ LLM',
  setSlot: '+ Set Slot',
  delay: '+ Delay',
  fixedmenu: '+ Fixed Menu',
  link: '+ Link',
  toast: '+ Toast',
  iframe: '+ iFrame',
  scenario: '+ Scenario Group', // Scenario Group 버튼용
} as any;

type ToolMode = "pan" | "select";

type LayerMenuState = {
  open: boolean;
  x: number;
  y: number;
};

type MenuTarget =
  | { type: "pane" }
  | { type: "node"; id: string }
  | { type: "edge"; id: string };

type ContextMenuState = {
  open: boolean;
  x: number;
  y: number;
  flowPosition?: { x: number; y: number } | null;
  target: any;
};

const Flow = ({ scenario, backend, scenarios, onClose }: any) => {
  const router = useRouter();
  const { showAlert, showConfirm } = useModal();
  const user = useStore((s: any) => s.user);

  const [toolMode, setToolMode] = useState<ToolMode>("pan");
  const isPanMode = toolMode === "pan";
  const isSelectMode = toolMode === "select";

  const {
    nodes, edges, onNodesChange, onEdgesChange, onConnect,
    fetchScenario, saveScenario, addNode, selectedNodeId,
    setSelectedNodeId, duplicateNode, deleteSelectedEdges,
    nodeColors, setNodeColor, nodeTextColors, setNodeTextColor,
    exportSelectedNodes, importNodes, addScenarioAsGroup, groupSelectedNodes,
    visibleNodeTypes, setNodes, setEdges,
    deleteNode, deleteNodesByIds,
    // 20260312 - undo/redo 기능 추가
    undo, redo
  } = useBuilderStore();
  

  const { getNodes, project, setCenter } = useReactFlow();
  const reactFlowWrapper = useRef<HTMLDivElement | null>(null);
  const selectedNodesCount = useMemo(
    () => nodes.filter((n: any) => n.selected).length,
    [nodes]
  );

  const groupableSelectedNodesCount = useMemo(() =>
    nodes.filter(
      (n: any) =>
        n.selected &&
        !n.parentNode &&
        n.type !== 'scenario' &&
        n.type !== 'selectionGroup'
    ).length,
    [nodes]
  );

  const [rightPanelWidth, setRightPanelWidth] = useState(400);
  const [isSimulatorVisible, setIsSimulatorVisible] = useState(false);
  const [isColorSettingsVisible, setIsColorSettingsVisible] = useState(false);
  const [isSimulatorExpanded, setIsSimulatorExpanded] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

  const [isLogVisible, setIsLogVisible] = useState(false);

  useEffect(() => {
    if (scenario) {
      fetchScenario(backend, scenario.id);
    }
  }, [scenario, backend, fetchScenario]);

  // 20260312 - undo/redo 기능 추가
  const canUndo = useBuilderHistoryStore((state) => state.past.length > 0);
  const canRedo = useBuilderHistoryStore((state) => state.future.length > 0);

  // 노드 다중 선택
  const [selectedNodes, setSelectedNodes] = useState<any[]>([]);
  // 20260312 - 노드 검색 기능
  const [searchType, setSearchType] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  // 20260312 - 노드 패널 접기/펼치기 상태
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);
  // 20260312 - 노드 패널 접기/펼치기 상태
  const [isCanvasPanelCollapsed, setIsCanvasPanelCollapsed] = useState(false);
  // 20260312 - 에뮬 실행 데이터 표시 패널 상태 ( 캔버스 패널 height 조정 위해 별도 상태로 분리 )
  const [isSlotDisplayVisible, setIsSlotDisplayVisible] = useState(false);
  const [canvasPanelHeight, setCanvasPanelHeight] = useState(0);
  const searchPanelRef = useRef<HTMLDivElement | null>(null);

  // 20260316 - 플레이 추가
  const {
    runBetweenStartAndAnchor,
    stopExecution,
    executionRunning,
    selectBranchReply,
    cancelBranchReplySelection,
  } = useBuilderExecution({ nodes, edges } as any);

  const pendingBranchSelection = builderExecutionStore(
    (state) => state.pendingBranchSelection
  );

  const executionLogs = builderExecutionStore((state) => state.executionLogs);
  const executionError = builderExecutionStore((state) => state.executionError);
  const resetExecution = builderExecutionStore((state) => state.resetExecution);
  const [isExecutionLogVisible, setIsExecutionLogVisible] = useState(false);

  // 20260317 - 클립보드
  const copySelection = builderClipboardStore((state) => state.copySelection);
  const cutSelection = builderClipboardStore((state) => state.cutSelection);
  const pasteClipboard = builderClipboardStore((state) => state.pasteClipboard);
  const clipboard = builderClipboardStore((state) => state.clipboard);

  // ===========================================================
  // 20260316 - 메모 패드 상태 추가
  const [isMemoVisible, setIsMemoVisible] = useState(false);
  const [memos, setMemos] = useState([
    {
      id: utils.getSafeUUID(),
      text: "",
      backgroundColor: "#fff7c2",
      textColor: "#111827",
    },
  ]) as any[];
  // ===========================================================

  // ===========================================================
  // 20260316 - 캔버스 메모 상태 추가
  const [memoNodes, setMemoNodes] = useState<MemoCanvasItem[]>([]);
  const [selectedMemoId, setSelectedMemoId] = useState<string | null>(null);
  const [draggingMemoId, setDraggingMemoId] = useState<string | null>(null);
  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });

  const resizeStateRef = useRef<{
    id: string;
    startClientX: number;
    startClientY: number;
    startWidth: number;
    startHeight: number;
  } | null>(null);

  const dragStateRef = useRef<{
    id: string;
    startClientX: number;
    startClientY: number;
    startX: number;
    startY: number;
  } | null>(null);

  const addCanvasMemo = () => {
    const bounds = reactFlowWrapper.current?.getBoundingClientRect();
    if (!bounds) return;

    const center = project({
      x: bounds.width / 2,
      y: bounds.height / 2,
    });

    setMemoNodes((prev) => [
      ...prev,
      {
        id: utils.getSafeUUID(),
        x: center.x - 120,
        y: center.y - 80,
        backgroundOpacity: 0.9,
        width: 400,
        height: 240,
        text: "",
        backgroundColor: "#fff7c2",
        textColor: "#111827",
        isCollapsed: false,
        zIndex: prev.length + 1,
      },
    ]);
  };

  const updateMemoNode = useCallback(
    (id: string, patch: Partial<MemoCanvasItem>) => {
      setMemoNodes((prev) =>
        prev.map((memo) =>
          memo.id === id ? { ...memo, ...patch } : memo
        )
      );
    },
    []
  );

  const removeMemoNode = useCallback((id: string) => {
    setMemoNodes((prev) => prev.filter((memo) => memo.id !== id));

    setSelectedMemoId((prev) => (prev === id ? null : prev));
  }, []);

  const toggleMemoCollapsed = useCallback((id: string) => {
    setMemoNodes((prev) =>
      prev.map((memo) =>
        memo.id === id
          ? { ...memo, isCollapsed: !memo.isCollapsed }
          : memo
      )
    );
  }, []);


  const handleMemoPointerDown = (event: React.PointerEvent, id: string) => {
    const memo = memoNodes.find((item) => item.id === id);
    if (!memo) return;

    dragStateRef.current = {
      id,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: memo.x,
      startY: memo.y,
    };
  };

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const drag = dragStateRef.current;
      if (drag) {
        const dx = (event.clientX - drag.startClientX) / viewport.zoom;
        const dy = (event.clientY - drag.startClientY) / viewport.zoom;

        setMemoNodes((prev) =>
          prev.map((memo) =>
            memo.id === drag.id
              ? { ...memo, x: drag.startX + dx, y: drag.startY + dy }
              : memo
          )
        );
      }

      const resize = resizeStateRef.current;
      if (resize) {
        const dx = (event.clientX - resize.startClientX) / viewport.zoom;
        const dy = (event.clientY - resize.startClientY) / viewport.zoom;

        setMemoNodes((prev) =>
          prev.map((memo) =>
            memo.id === resize.id
              ? {
                  ...memo,
                  width: Math.max(180, resize.startWidth + dx),
                  height: Math.max(100, resize.startHeight + dy),
                }
              : memo
          )
        );
      }
    };


    const handlePointerUp = () => {
      dragStateRef.current = null;
      resizeStateRef.current = null;
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [viewport.zoom]);

  const handleMemoResizeStart = (event: React.PointerEvent, id: string) => {
    event.stopPropagation();

    const memo = memoNodes.find((item) => item.id === id);
    if (!memo) return;

    resizeStateRef.current = {
      id,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startWidth: memo.width,
      startHeight: memo.height,
    };
  };
  // ===========================================================

  
  // ===========================================================
  // 20260317 - 마우스 우 클릭 메뉴
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    open: false,
    x: 0,
    y: 0,
    target: null,
  });

  const deleteEdge = (edgeId: string) => {
    const updateEdges = edges.map((prev: any) => prev.filter((edge: any) => edge.id !== edgeId));
    setEdges(updateEdges);
  };

  const getSelectedNodeIds = useCallback(() => {
    return nodes.filter((node: any) => node.selected).map((node: any) => node.id);
  }, [nodes]);

  const isSelectionLayerTarget = useCallback((target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) return false;

    const pane = target.closest('.react-flow__pane');
    const isSelectionPane = pane?.classList.contains('selection') ?? false;

    return Boolean(
      isSelectionPane ||
      target.closest('.react-flow__nodesselection') ||
      target.closest('.react-flow__nodesselection-rect') ||
      target.closest('.react-flow__selection')
    );
  }, []);


  const closeContextMenu = () => {
    setContextMenu({
      open: false,
      x: 0,
      y: 0,
      target: null,
    });
  };

  const handlePaneContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();

    const clearedEdges: Edge<any>[] = edges.map((edge) => ({
      ...edge,
      selected: false,
    }));

    const { x, y } = getSafeMenuPosition(event.clientX, event.clientY, "pane");
    const bounds = reactFlowWrapper.current?.getBoundingClientRect();
    const flowPosition = bounds
    ? project({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      })
    : null;

    setSelectedNodeId(null);
    setEdges(clearedEdges);

    setContextMenu({
      open: true,
      x,
      y,
      flowPosition,
      target: { type: "pane" },
    });
  };

  const handleNodeContextMenu = (
    event: React.MouseEvent,
    node: Node<any>
  ) => {
    event.preventDefault();
    event.stopPropagation();

    const clearedEdges: Edge<any>[] = edges.map((edge) => ({
      ...edge,
      selected: false,
    }));
    
    const { x, y } = getSafeMenuPosition(event.clientX, event.clientY, "node");
    const bounds = reactFlowWrapper.current?.getBoundingClientRect();
    const flowPosition = bounds
    ? project({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      })
    : null;

    setSelectedNodeId(node.id);
    setEdges(clearedEdges);

    setContextMenu({
      open: true,
      x,
      y,
      flowPosition,
      target: { type: "node", id: node.id },
    });
  };

  const handleEdgeContextMenu = (
    event: React.MouseEvent,
    edge: Edge<any>
  ) => {
    event.preventDefault();
    event.stopPropagation();

    const nextEdges: Edge<any>[] = edges.map((item) => ({
      ...item,
      selected: item.id === edge.id,
    }));
    
    const { x, y } = getSafeMenuPosition(event.clientX, event.clientY, "edge");
    const bounds = reactFlowWrapper.current?.getBoundingClientRect();
    const flowPosition = bounds
    ? project({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      })
    : null;

    setSelectedNodeId(null);
    setEdges(nextEdges);

    setContextMenu({
      open: true,
      x,
      y,
      flowPosition,
      target: { type: "edge", id: edge.id },
    });
  };

  const handleSelectionContextMenuCapture = useCallback(
    (event: React.MouseEvent) => {
      const selectedIds = getSelectedNodeIds();
      const hitSelectionLayer = isSelectionLayerTarget(event.target);

      if (!hitSelectionLayer) return;
      if (selectedIds.length === 0) return;

      event.preventDefault();
      event.stopPropagation();

      const { x, y } = getSafeMenuPosition(event.clientX, event.clientY, "node");
      const bounds = reactFlowWrapper.current?.getBoundingClientRect();
      const flowPosition = bounds
        ? project({
            x: event.clientX - bounds.left,
            y: event.clientY - bounds.top,
          })
        : null;

      setContextMenu({
        open: true,
        x,
        y,
        flowPosition,
        target: {
          type: "selection",
          ids: selectedIds,
        },
      });
    },
    [getSelectedNodeIds, isSelectionLayerTarget, project]
  );


  const MENU_WIDTH = 220;
  const MENU_HEIGHTS = {
    pane: 350,
    node: 56,
    edge: 56,
  } as const;
  const MENU_GAP = 8;

  const getSafeMenuPosition = (
    clientX: number,
    clientY: number,
    menuType: "pane" | "node" | "edge"
  ) => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const menuHeight = MENU_HEIGHTS[menuType];

    let x = clientX;
    let y = clientY;

    if (x + MENU_WIDTH + MENU_GAP > viewportWidth) {
      x = viewportWidth - MENU_WIDTH - MENU_GAP;
    }

    if (y + menuHeight + MENU_GAP > viewportHeight) {
      y = viewportHeight - menuHeight - MENU_GAP;
    }

    x = Math.max(MENU_GAP, x);
    y = Math.max(MENU_GAP, y);

    return { x, y };
  };
  // ===========================================================

  
  // ===========================================================
  // 20260317 - 클립보드
  const pushHistory = useCallback(() => {
    useBuilderHistoryStore.getState().push(makeSnapshot(useBuilderStore.getState()));
  }, []);

  // 선택 대상 계산 helper
  const getTargetNodeIdsForContextMenu = useCallback((targetNodeId?: string) => {
    const selectedIds = nodes.filter((node) => node.selected).map((node) => node.id);

    if (!targetNodeId) return selectedIds;

    if (selectedIds.includes(targetNodeId)) {
      return selectedIds;
    }

    return [targetNodeId];
  }, [nodes]);

  // 노드 우클릭 메뉴 액션
  const handleContextCopyNodes = useCallback((targetNodeId: string) => {
    const targetIds = getTargetNodeIdsForContextMenu(targetNodeId);

    copySelection({
      nodes,
      edges,
      selectedNodeIds: targetIds,
    });

    closeContextMenu();
  }, [copySelection, edges, getTargetNodeIdsForContextMenu, nodes]);

  const handleContextCutNodes = useCallback((targetNodeId: string) => {
    const targetIds = getTargetNodeIdsForContextMenu(targetNodeId);

    cutSelection({
      nodes,
      edges,
      selectedNodeIds: targetIds,
      deleteNodesByIds,
    });

    closeContextMenu();
  }, [cutSelection, deleteNodesByIds, edges, getTargetNodeIdsForContextMenu, nodes]);

  const handleContextPaste = useCallback((pastePosition?: { x: number; y: number } | null) => {
    pasteClipboard({
      nodes,
      edges,
      setNodes,
      setEdges,
      pushHistory,
      pastePosition,
    });

    closeContextMenu();
  }, [edges, nodes, pasteClipboard, pushHistory, setEdges, setNodes]);
  // ===========================================================

  // 20260312 - 키보드 단축키 (Undo/Redo)
  useEffect(() => {
    const handleHistoryKey = (event: KeyboardEvent) => {
      const isMetaOrCtrl = event.metaKey || event.ctrlKey;
      if (!isMetaOrCtrl) return;

      const key = event.key.toLowerCase();

      if (key === 'z' && !event.shiftKey) {
        event.preventDefault();
        undo();
        return;
      }

      if ((key === 'z' && event.shiftKey) || key === 'y') {
        event.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleHistoryKey);
    return () => window.removeEventListener('keydown', handleHistoryKey);
  }, [undo, redo]);

  const visibleNodes = useMemo(() => {
    const collapsedGroupIds = new Set(nodes.filter((n: any) => (n.type === 'scenario' || n.type === 'selectionGroup') && n.data.isCollapsed).map((n: any) => n.id));
    return nodes.filter((n: any) => !n.parentNode || !collapsedGroupIds.has(n.parentNode));
  }, [nodes]);

  // 20260312 - 노드 검색 기능
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
          ...(Array.isArray(data.apis) ? data.apis.map((api: any) => api?.name) : []),
        ];
      case 'branch':
        return Array.isArray(data.replies) ? data.replies.map((reply: any) => reply?.display) : [];
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

      const text = getNodeSearchText(node).filter(Boolean).join(' ').toLowerCase();
      return text.includes(keyword);
    });
  }, [nodes, searchType, searchKeyword, getNodeSearchText]);

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

  const focusNode = useCallback((targetNode: any) => {
    if (!targetNode) return;

    setSelectedNodeId(targetNode.id);
    setNodes(
      nodes.map((node: any) => ({
        ...node,
        selected: node.id === targetNode.id,
      }))
    );

    const abs = getAbsoluteNodePosition(targetNode, nodes);
    const width = Number(targetNode.width ?? targetNode.style?.width ?? 250);
    const height = Number(targetNode.height ?? targetNode.style?.height ?? 150);

    setCenter(abs.x + width / 2, abs.y + height / 2, {
      zoom: 1.1,
      duration: 500,
    });
  }, [nodes, setNodes, setSelectedNodeId, setCenter]);

  const handleNodeClick = (event: any, node: any) => {
    // 20260311
    const isShiftPressed = event.shiftKey;

    if (isShiftPressed) {
      setSelectedNodes((prev: any) => {
        const exists = prev.some((item: any) => item.id === node.id);
        if (exists) return prev;
        return [...prev, node];
      });
      setSelectedNodeId(null);
      return;
    } else {
      setSelectedNodeId(node.id);
    }
  };

  // 20260312 - 노드 검색 패널 높이에 따라 캔버스 패널 높이 조정
  const updateCanvasPanelHeight = useCallback(() => {
    if (!searchPanelRef.current) return;
    setCanvasPanelHeight(searchPanelRef.current.offsetHeight);
  }, []);
  useLayoutEffect(() => {
    updateCanvasPanelHeight();
  }, [updateCanvasPanelHeight, isCanvasPanelCollapsed, filteredSearchResults.length]);

  useEffect(() => {
    window.addEventListener('resize', updateCanvasPanelHeight);
    return () => window.removeEventListener('resize', updateCanvasPanelHeight);
  }, [updateCanvasPanelHeight]);

  const handlePaneClick = () => {
    setSelectedNodeId(null);

    // 마우스 우 클릭 이벤트
    closeContextMenu();
  };

  const handleMainResize = (mouseDownEvent: any) => {
    mouseDownEvent.preventDefault();
    const startSize = rightPanelWidth;
    const startPosition = mouseDownEvent.clientX;

    const onMouseMove = (mouseMoveEvent: any) => {
      const newSize = startSize - (mouseMoveEvent.clientX - startPosition);
      if (newSize > 350 && newSize < 1000) {
        setRightPanelWidth(newSize);
      }
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleDuplicateNode = () => {
    if (selectedNodeId) {
      duplicateNode(selectedNodeId);
    }
  };

  const handleKeyDown = (event: any) => {
    if (event.key === 'Backspace' || event.key === 'Delete') {
      const isNodeSelected = nodes.some((node: any) => node.selected);
      if (!isNodeSelected) {
        deleteSelectedEdges();
      }
    }
  };

  const onDragStart = (event: any, nodeType: any) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = useCallback((event: any) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: any) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');

      if (typeof type === 'undefined' || !type) {
        return;
      }

      if (!reactFlowBounds) return;
      const position = project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      addNode(type, position);
    },
    [project, addNode]
  );

  const handleExportNodes = () => {
    const allNodes = getNodes();
    const selectedNodes = allNodes.filter(n => n.selected);
    exportSelectedNodes(selectedNodes);
  };

  const handleGroupSelectedNodes = () => {
    const groupLabel = window.prompt('그룹명을 입력하세요.', 'Selected Group');
    if (groupLabel === null) return;
    groupSelectedNodes(groupLabel.trim() || 'Selected Group');
  };


  // 💡 [수정] 스토어의 visibleNodeTypes를 기반으로 버튼 필터링
  const visibleNodeButtons = ALL_NODE_TYPES
    .filter((type: any) => visibleNodeTypes.includes(type) && type !== 'fixedmenu' && type !== 'scenario')
    .map((type: any) => ({ type, label: nodeLabels[type] || `+ ${type}` }));

  // 💡 [수정] 컬러 세팅은 모든 노드(fixedmenu 제외)에 대해 표시
  const colorSettingButtons = ALL_NODE_TYPES
    .filter((type: any) => type !== 'fixedmenu' && type !== 'scenario')
    .map((type: any) => ({ type, label: nodeLabels[type] || `+ ${type}` }));

  // 관리자 인지 확인
  const isAdmin = user.roles.some((t: string) => t.includes('admin'));

  return (
    <div className={styles.flowContainer}>
      <ScenarioGroupModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        scenarios={scenarios.filter((s: any) => s.id !== scenario.id)}
        onSelect={(selected: any) => {
          addScenarioAsGroup(backend, selected);
          setIsGroupModalOpen(false);
        }}
      />
      <div className={`${styles.leftSidebar} ${isLeftPanelCollapsed ? styles.leftSidebarCollapsed : ''}`}>
        <div className={styles.sidebarHeader}>
          <h3>Add Node</h3>
          <span className={styles.globalColorSettingButton} onClick={() => setIsColorSettingsVisible(!isColorSettingsVisible)}>
            <SettingsIcon />
          </span>
        </div>

        {isColorSettingsVisible && (
          <div className={styles.colorSettingsPanel}>
            {/* 💡 [수정] colorSettingButtons 사용 */}
            {colorSettingButtons.map(({ type, label }: any) => (
              <div key={type} className={styles.colorSettingItem}>
                <span>{label.replace('+ ', '')}</span>
                <div className={styles.colorInputs}>
                  <input
                    type="color"
                    value={nodeColors[type]}
                    onChange={(e) => setNodeColor(type, e.target.value)}
                  />
                  <input
                    type="color"
                    value={nodeTextColors[type]}
                    onChange={(e) => setNodeTextColor(type, e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 💡 [수정] visibleNodeButtons 사용 */}
        {visibleNodeButtons.map(({ type, label }: any) => (
          <button
            key={type}
            onClick={() => addNode(type)}
            onDragStart={(event) => onDragStart(event, type)}
            draggable
            className={styles.sidebarButton}
            style={{
              backgroundColor: nodeColors[type],
              color: nodeTextColors[type]
            }}
          >
            {label}
          </button>
        ))}

        {/* 💡 [수정] 'scenario' 타입이 visibleNodeTypes에 있을 때만 Scenario Group 버튼 표시 */}
        {visibleNodeTypes.includes('scenario') && (
          <>
            <div className={styles.separator} />
            <button onClick={() => setIsGroupModalOpen(true)} className={styles.sidebarButton} style={{ backgroundColor: nodeColors.scenario, color: nodeTextColors.scenario }}>
              + Scenario Group
            </button>
          </>
        )}

        <div className={styles.separator} />
        <button onClick={importNodes} className={styles.sidebarButton} style={{ backgroundColor: '#555', color: 'white' }}>
          Import Nodes
        </button>
        <button onClick={handleExportNodes} className={styles.sidebarButton} disabled={selectedNodesCount === 0} style={{ backgroundColor: '#555', color: 'white' }}>
          Export Nodes ({selectedNodesCount})
        </button>

        {selectedNodeId && (
          <>
            <div className={styles.separator} />
            <button onClick={handleDuplicateNode} className={`${styles.sidebarButton} ${styles.duplicateButton}`}>
              + Duplicate Node
            </button>
          </>
        )}
      </div>

      <div
        className={styles.mainContent}
        ref={reactFlowWrapper}
        onContextMenuCapture={handleSelectionContextMenuCapture}
      >
        {/* Current Values */}
        {isSlotDisplayVisible && (
          <div
            className={styles.slotDisplayAnchor}
            style={{ top: `${canvasPanelHeight + 24}px` }}
          >
            <SlotDisplay />
          </div>
        )}

        {/* Memo Pad */}
        {isMemoVisible && (
          <div
            className={styles.memoPadAnchor}
            style={{ top: `${canvasPanelHeight + 24}px` }}
          >
            <MemoPad memos={memos} setMemos={setMemos} />
          </div>
        )}

        <div className={styles.topRightControls}>
          {/* 우측 상단 버튼 영역 
          <div onClick={() => saveScenario(backend, scenario)}>
            <img src="/images/save.png" alt="Save Icon" className={styles.saveButton} />
          </div>
          <div 
            onClick={() => {
              // 시뮬레이터 열 때 캔버스 패널은 자동으로 숨겨지도록 설정
              setIsCanvasPanelCollapsed(!isSimulatorVisible);
              // 시뮬레이터가 열리는 동안 노드 드래그 비활성화
              setIsLeftPanelCollapsed(!isSimulatorVisible);
              // current values 패널은 시뮬레이터와 함께 보이도록 설정
              setIsSlotDisplayVisible(!isSimulatorVisible);
              // 시뮬레이터 토글
              setIsSimulatorVisible(!isSimulatorVisible);
            }}
          >
            <img src="/images/chat_simulator.png" alt="Simulator Icon" className={!isSimulatorVisible ? styles.botButtonHidden : styles.botButton} />
          </div>
          <div onClick={onClose}>
            <span className={styles.globalColorSettingButton}>
              <IconListBack width="35" height="35" />
            </span>
          </div>
          */}
        </div>
        <ReactFlow
          className={isPanMode ? styles.panCanvas : styles.selectCanvas}
          nodes={visibleNodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodeClick={handleNodeClick}
          onKeyDown={handleKeyDown}
          onDragOver={onDragOver}
          onDrop={onDrop}
          defaultViewport={{ x: 0, y: 0, zoom: 0.1 }}
          fitView
          fitViewOptions={{ padding: 0.2, maxZoom: 1.2 }}
          // 메모 노드 드래그 시 뷰포트 업데이트
          onMove={(_, vp) => setViewport(vp)}

          // UX 개선을 위한 줌 및 패닝 설정
          zoomOnScroll // 마우스 휠 줌 사용
          zoomOnPinch // 트랙패드/터치 핀치 줌 사용
          zoomOnDoubleClick={false} // 더블클릭 실수 확대 방지
          minZoom={0.02} // 캔버스를 아주 멀리 축소 가능
          maxZoom={10} // 노드 편집할 때 충분히 크게 확대 가능

          panOnDrag={isPanMode} // 이동/선택 모드 전환 핵심
          selectionOnDrag={isSelectMode}
          selectionMode={SelectionMode.Partial}
          multiSelectionKeyCode="Shift" // 필요시 shift 없이 바로 다중선택 가능

          style={{ backgroundColor: '#ffffff' }}
          nodesDraggable={!isSimulatorVisible} // 시뮬레이터가 보이는 동안에는 노드 드래그 비활성화
          deleteKeyCode="Delete" // 'Delete' 키로 엣지 삭제
          // defaultEdgeOptions={{
          //   type: 'smoothstep', // step, smoothstep, bezier, simplebezier, default
          //   animated: false,
          //   markerEnd: { type: MarkerType.ArrowClosed, color: '#cbd5e1' },
          //   style: { stroke: '#cbd5e1', strokeWidth: 2, strokeDasharray: '0' },
          // }}
          defaultEdgeOptions={{
            type: 'orthogonal', // custom options: draggable, draggableStep, orthogonal
            animated: false,
            markerEnd: { type: MarkerType.ArrowClosed, color: '#cbd5e1' },
            style: { stroke: '#cbd5e1', strokeWidth: 3, strokeDasharray: '0' },
          }}
          connectionLineStyle={{
            stroke: '',
            strokeWidth: 3,
            strokeDasharray: '0',
            animation: 'none',
          }} // 노드를 연결할 때 드래그 중에 보이는 “임시 연결선”의 스타일을 지정하는 옵션

          // 마우스 우클릭 메뉴 custom 수정
          onPaneContextMenu={handlePaneContextMenu}
          onNodeContextMenu={handleNodeContextMenu}
          onEdgeContextMenu={handleEdgeContextMenu}
          onPaneClick={handlePaneClick}
        >
          <Background color="#cbd5e1" gap={16} />
          <Controls />
          <MiniMap nodeColor={(n: any) => nodeColors[n.type] || '#ddd'} nodeStrokeWidth={3} zoomable pannable />

          <Panel position="top-left">
            <div 
              ref={searchPanelRef}
              className={`${styles.searchPanel} ${
                isCanvasPanelCollapsed ? styles.searchPanelCollapsed : ""
              }`}
            >
              <div className={styles.searchTopRow}>
                <div className={styles.toolRow}>
                  <button
                    type="button"
                    onClick={undo}
                    title="Undo (Ctrl/Cmd+Z)"
                    className={styles.toolButton}
                    disabled={!canUndo}
                  >
                    <Undo size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={redo}
                    title="Redo (Ctrl+Y, Cmd+Shift+Z)"
                    className={styles.toolButton}
                    disabled={!canRedo}
                  >
                    <Redo size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      console.log("save memo panel data ======> ", memos);
                      console.log("save memo node data ======> ", memoNodes);
                      console.log("save scenario data ======> ", scenario);
                      resetExecution();
                      saveScenario(backend, scenario);
                    }}
                    title="Save Scenario"
                    className={styles.toolButton}
                  >
                    <Save size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    title="Back to Scenario List"
                    className={styles.toolButton}
                  >
                    <ArrowLeft size={18} />
                  </button>

                  <div
                    style={{
                      margin: "0 4px",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    |
                  </div>
{/* 
                  <button
                    type="button"
                    title={isLeftPanelCollapsed ? 'Show left panel' : 'Hide left panel'}
                    onClick={() => setIsLeftPanelCollapsed((prev) => !prev)}
                    className={`${styles.toolButton} ${styles.panelToggleButton}`}
                  >
                    {isLeftPanelCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
                  </button>

                  <button
                    type="button"
                    title={isSlotDisplayVisible ? 'Hide Runtime State panel' : 'Show Runtime State panel'}
                    onClick={() => setIsSlotDisplayVisible((prev) => !prev)}
                    className={`${styles.toolButton} ${styles.panelToggleButton} ${
                      isSlotDisplayVisible ? styles.toolButtonActive : ""
                    }`}
                  >
                    <Database size={18} />
                  </button>

                  <div
                    style={{
                      margin: "0 4px",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    |
                  </div>
 */}
                  <button
                    type="button"
                    onClick={() => setToolMode("pan")}
                    title="Pan mode"
                    className={`${styles.toolButton} ${isPanMode ? styles.toolButtonActive : ""}`}
                  >
                    <Hand size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setToolMode("select")}
                    title="Select mode"
                    className={`${styles.toolButton} ${isSelectMode ? styles.toolButtonActive : ""}`}
                  >
                    <MousePointer2 size={18} />
                  </button>

                  <div
                    style={{
                      margin: "0 4px",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    |
                  </div>
                  {/* 마우스 우측 메뉴로 빠짐
                  <button
                    type="button"
                    title={isMemoVisible ? "Hide memo panel" : "Show memo panel"}
                    onClick={() => setIsMemoVisible((prev) => !prev)}
                    className={`${styles.toolButton} ${isMemoVisible ? styles.toolButtonActive : ""}`}
                  >
                    <NotebookPen size={18} />
                  </button>
                  */}
                  <button
                    type="button"
                    title={"canvas add Memo"}
                    onClick={addCanvasMemo}
                    className={styles.toolButton}
                  >
                    <StickyNote size={18} />
                  </button>
                  
                  <button
                    type="button"
                    title={"Show chatbot simulator"}
                    onClick={() => {
                      // console.log("save nodes data ======> ", nodes);
                      // console.log("save edges data ======> ", edges);
                      // 시뮬레이터가 열리는 동안 노드 드래그 비활성화
                      setIsLeftPanelCollapsed(!isSimulatorVisible);
                      // 시뮬레이터 열 때 캔버스 패널은 자동으로 숨겨지도록 설정
                      // setIsCanvasPanelCollapsed(!isSimulatorVisible);
                      // current values 패널은 시뮬레이터와 함께 보이도록 설정
                      setIsSlotDisplayVisible(!isSimulatorVisible);
                      // 시뮬레이터 토글
                      setIsSimulatorVisible(!isSimulatorVisible);
                    }}
                    className={`${styles.toolButton} ${isSimulatorVisible ? styles.toolButtonActive : ""}`}
                  >
                    <Sparkles size={18} />
                  </button>

                  {isAdmin ? (
                    <button
                      type="button"
                      title={"log preview (DB JSON 편집)"}
                      onClick={() => setIsLogVisible(true)}
                      className={`${styles.toolButton} ${isMemoVisible ? styles.toolButtonActive : ""}`}
                    >
                      <Activity size={18} />
                    </button>
                  ) : null}

                  <div
                    style={{
                      margin: "0 4px",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    |
                  </div>
                  
                  <button
                    type="button"
                    title="Run from Start to Anchor"
                    onClick={() => runBetweenStartAndAnchor()}
                    className={`${styles.toolButton} ${executionRunning ? styles.toolButtonActive : ""}`}
                    disabled={executionRunning}
                  >
                    <Play size={18} />
                  </button>

                  <button
                    type="button"
                    title="Stop execution"
                    onClick={() => stopExecution()}
                    className={styles.toolButton}
                    disabled={!executionRunning}
                  >
                    <Square size={18} />
                  </button>

                  <button
                    type="button"
                    title="Execution log"
                    onClick={() => setIsExecutionLogVisible(true)}
                    className={styles.toolButton}
                  >
                    <FileText size={18} />
                  </button>

                  <div
                    style={{
                      margin: "0 4px",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    |
                  </div>

                  <button
                    type="button"
                    title="Group Selected Nodes"
                    onClick={handleGroupSelectedNodes}
                    className={styles.toolButton}
                  >
                    <b>G</b>
                  </button>

                  <div
                    style={{
                      margin: "0 2px",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    |
                  </div>
                </div>

                <div className={styles.searchRow}>
                  <div className="relative">
                    <select
                      // className={styles.searchSelect}
                      className="appearance-none border border-gray-300 rounded-md px-3 py-2 pr-8 text-sm w-full bg-white"
                      value={searchType}
                      onChange={(e) => setSearchType(e.target.value)}
                    >
                      <option value="all">All</option>
                      {ALL_NODE_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {nodeLabels[type]?.replace('+ ', '') || type}
                        </option>
                      ))}
                    </select>
                    {/* 커스텀 화살표: 텍스트 왼쪽 padding과 동일한 간격(12px) */}
                    <ChevronDown
                      size={16}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                    />
                  </div>

                  <input
                    className={styles.searchInput}
                    type="text"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    placeholder="Search node message text"
                  />
                </div>

                <button
                  type="button"
                  title={isCanvasPanelCollapsed ? 'Show canvas panel' : 'Hide canvas panel'}
                  onClick={() => setIsCanvasPanelCollapsed((prev) => !prev)}
                  className={`${styles.toolButton} ${styles.panelToggleButton}`}
                >
                  {isCanvasPanelCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                </button>
              </div>

              {!isCanvasPanelCollapsed && filteredSearchResults.length > 0 && (
                <div className={styles.searchResults}>
                  {filteredSearchResults.map((node: any) => (
                    <div
                      key={node.id}
                      className={styles.searchResultCard}
                      onClick={() => focusNode(node)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          focusNode(node);
                        }
                      }}
                    >
                      <div className={styles.searchResultHeader}>
                        <div className={styles.searchResultType}>
                          {nodeLabels[node.type]?.replace('+ ', '') || node.type}
                        </div>
                        <div className={styles.searchResultId}>{node.id}</div>
                      </div>

                      <div className={styles.searchResultText}>
                        {getNodeSearchText(node).filter(Boolean).join(' ') || '(empty)'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Panel>
        </ReactFlow>
        
        {/* 캔버스 마우스 우클릭 메뉴 */}
        {contextMenu.open && contextMenu.target?.type === "pane" && (
          <div
            className={styles.layerMenu}
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              type="button"
              className={`${styles.layerMenuItem} ${!clipboard ? styles.layerMenuItemDisabled : ""}`}
              onClick={() => handleContextPaste(contextMenu.flowPosition ?? null)}
              disabled={!clipboard}
            >
              <Clipboard size={16} className={styles.layerMenuIcon} />
              <span>Paste</span>
            </button>

            <div className={styles.layerMenuDivider} />
            
            <button
              type="button"
              className={styles.layerMenuItem}
              onClick={() => setIsLeftPanelCollapsed((prev) => !prev)}
            >
              {isLeftPanelCollapsed ? 
                <PanelLeftOpen size={16} className={styles.layerMenuIcon} /> : 
                <PanelLeftClose size={16} className={styles.layerMenuIcon} />
              }
              <span>Left Panel</span>
            </button>
            <button
              type="button"
              className={styles.layerMenuItem}
              onClick={() => setIsMemoVisible((prev) => !prev)}
            >
              <NotebookPen size={16} className={styles.layerMenuIcon} />
              memo panel
            </button>
            <button
              type="button"
              className={styles.layerMenuItem}
              onClick={() => setIsSlotDisplayVisible((prev) => !prev)}
            >
              <Database size={16} className={styles.layerMenuIcon} />
              Runtime State
            </button>

            <div className={styles.layerMenuDivider} />

            <button
              type="button"
              className={styles.layerMenuItem}
              onClick={() => {
                setContextMenu({open: false, x: 0, y: 0, target: "pane"});
                setToolMode("pan");
              }}
            >
              <Hand size={16} className={styles.layerMenuIcon} />
              <span>Pan Mode</span>
            </button>
            <button
              type="button"
              className={styles.layerMenuItem}
              onClick={() => {
                setContextMenu({open: false, x: 0, y: 0, target: "pane"});
                setToolMode("select");
              }}
            >
              <MousePointer2 size={16} className={styles.layerMenuIcon} />
              <span>Select Mode</span>
            </button>

            <div className={styles.layerMenuDivider} />

            <button
              type="button"
              className={styles.layerMenuItem}
              onClick={() => {
                setContextMenu({open: false, x: 0, y: 0, target: "pane"});
                addCanvasMemo();
              }}
            >
              <StickyNote size={16} className={styles.layerMenuIcon} />
              <span>Add Memo</span>
            </button>

            <div className={styles.layerMenuDivider} />

            <button
              type="button"
              className={styles.layerMenuItem}
              onClick={() => {
                setContextMenu({open: false, x: 0, y: 0, target: "pane"});
                onClose();
              }}
            >
              <ArrowLeft size={16} className={styles.layerMenuIcon} />
              <span>Exit</span>
            </button>
          </div>
        )}

        {/* 노드 우클릭 */}
        {contextMenu.open && contextMenu.target?.type === "node" && (
          <div className={styles.layerMenu} style={{ left: contextMenu.x, top: contextMenu.y }}>
            <button
              type="button"
              className={styles.layerMenuItem}
              onClick={() => handleContextCopyNodes(contextMenu.target.id)}
            >
              <Copy size={16} className={styles.layerMenuIcon} />
              <span>Copy Node</span>
            </button>

            <button
              type="button"
              className={styles.layerMenuItem}
              onClick={() => handleContextCutNodes(contextMenu.target.id)}
            >
              <Scissors size={16} className={styles.layerMenuIcon} />
              <span>Cut Node</span>
            </button>

            <button
              type="button"
              className={`${styles.layerMenuItem} ${!clipboard ? styles.layerMenuItemDisabled : ""}`}
              onClick={() => handleContextPaste(contextMenu.flowPosition ?? null)}
              disabled={!clipboard}
            >
              <Clipboard size={16} className={styles.layerMenuIcon} />
              <span>Paste</span>
            </button>

            <div className={styles.layerMenuDivider} />

            <button
              type="button"
              className={styles.layerMenuItem}
              onClick={() => {
                deleteNode(contextMenu.target.id);
                closeContextMenu();
              }}
            >
              <Trash size={16} className={styles.layerMenuIcon} />
              <span>Delete Node</span>
            </button>
          </div>
        )}

        {/* 엣지 우클릭 */}
        {contextMenu.open && contextMenu.target?.type === "edge" && (
          <div
            className={styles.layerMenu}
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              type="button"
              className={styles.layerMenuItem}
              onClick={() => {
                deleteEdge(contextMenu.target.id);
                closeContextMenu();
              }}
            >
              <Trash2 size={16} className={styles.layerMenuIcon} />
              <span>Delete Edge</span>
            </button>
          </div>
        )}

        {/* select 영역 */}
        {contextMenu.open && contextMenu.target?.type === "selection" && (
          <div
            className={styles.layerMenu}
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              type="button"
              className={styles.layerMenuItem}
              onClick={() => {
                copySelection({
                  nodes,
                  edges,
                  selectedNodeIds: contextMenu.target.ids,
                });
                closeContextMenu();
              }}
            >
              <Copy size={16} className={styles.layerMenuIcon} />
              <span>Copy Selected Nodes</span>
            </button>

            <button
              type="button"
              className={styles.layerMenuItem}
              onClick={() => {
                cutSelection({
                  nodes,
                  edges,
                  selectedNodeIds: contextMenu.target.ids,
                  deleteNodesByIds,
                });
                closeContextMenu();
              }}
            >
              <Scissors size={16} className={styles.layerMenuIcon} />
              <span>Cut Selected Nodes</span>
            </button>

            <button
              type="button"
              className={`${styles.layerMenuItem} ${!clipboard ? styles.layerMenuItemDisabled : ""}`}
              onClick={() => {
                handleContextPaste(contextMenu.flowPosition ?? null);
              }}
              disabled={!clipboard}
            >
              <Clipboard size={16} className={styles.layerMenuIcon} />
              <span>Paste</span>
            </button>
          </div>
        )}

        {/* Canvas Memo Layer */}
        <CanvasMemoLayer
          memoNodes={memoNodes}
          selectedMemoId={selectedMemoId}
          viewport={viewport}
          onSelect={setSelectedMemoId}
          onUpdate={updateMemoNode}
          onRemove={removeMemoNode}
          onToggleCollapse={toggleMemoCollapsed}
          onDragStart={handleMemoPointerDown}
          onResizeStart={handleMemoResizeStart}
        />
      </div>

      <div className={`${styles.controllerPanel} ${selectedNodeId ? styles.visible : ''}`}>
        <NodeController backend={backend} />
      </div>

      <div className={`${styles.resizerV} ${isSimulatorVisible && !isSimulatorExpanded ? styles.visible : ''}`} onMouseDown={handleMainResize} />

      <div
        className={`${styles.rightContainer} ${isSimulatorVisible ? styles.visible : ''}`}
        style={{ width: isSimulatorExpanded ? 'max(600px, 50%)' : isSimulatorVisible ? `${rightPanelWidth}px` : '0' }}
      >
        <div className={styles.panel}>
          <ChatbotSimulator
            nodes={nodes}
            edges={edges}
            isVisible={isSimulatorVisible}
            isExpanded={isSimulatorExpanded}
            setIsExpanded={setIsSimulatorExpanded}
          />
        </div>
      </div>

      <div
        className={`${isExecutionLogVisible ? "flex" : "hidden"} fixed inset-0 z-50 items-center justify-center bg-black/40`}
        onClick={() => setIsExecutionLogVisible(false)}
      >
        <div
          className="bg-white w-[900px] max-w-[95vw] max-h-[80vh] rounded-lg shadow-lg flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-4 py-2 border-b">
            <h2 className="text-sm font-semibold">Execution Log</h2>
            <button
              onClick={() => setIsExecutionLogVisible(false)}
              className="text-xs px-2 py-1 border rounded hover:bg-gray-100"
            >
              닫기
            </button>
          </div>

          <div className="p-4 overflow-y-auto">
            {executionError ? (
              <div className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {executionError}
              </div>
            ) : null}

            <pre className="text-xs whitespace-pre-wrap break-words">
              {JSON.stringify(executionLogs, null, 2)}
            </pre>
          </div>
        </div>
      </div>

      {/* isLogVisible 로 hidden / flex 전환 */}
      <div
        className={`${isLogVisible ? 'flex' : 'hidden'} fixed inset-0 z-50 items-center justify-center bg-black/40`}
        onClick={() => setIsLogVisible(false)}
      >
        <div
          className="bg-white w-[800px] max-w-[95vw] max-h-[80vh] rounded-lg shadow-lg flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-4 py-2 border-b">
            <h2 className="text-sm font-semibold">Log (DB JSON 편집)</h2>
            <button
              onClick={() => setIsLogVisible(false)}
              className="text-xs px-2 py-1 border rounded hover:bg-gray-100"
            >
              닫기
            </button>
          </div>

          <div className="p-4 overflow-y-auto">
            <LogPreview
              nodes={nodes}
              edges={edges}
              setNodes={setNodes}
              setEdges={setEdges}
            />
          </div>
        </div>
      </div>

      {/* play 시 branch node type 모달 */}
      <div
        className={`${
          pendingBranchSelection ? "flex" : "hidden"
        } fixed inset-0 z-50 items-center justify-center bg-black/40`}
      >
        <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
          <div className="mb-2 text-lg font-semibold">분기 선택</div>
          <div className="mb-4 whitespace-pre-wrap text-sm text-gray-700">
            {pendingBranchSelection?.title || "진행할 흐름을 선택하세요."}
          </div>

          <div className="flex flex-col gap-2">
            {pendingBranchSelection?.replies.map((reply) => (
              <button
                key={reply.value}
                type="button"
                onClick={() => selectBranchReply(reply.value)}
                className="rounded-md border border-gray-200 px-3 py-2 text-left text-sm hover:bg-gray-50"
              >
                {reply.display}
              </button>
            ))}
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={cancelBranchReplySelection}
              className="rounded-md border border-gray-200 px-3 py-2 text-sm"
            >
              취소
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}

import { ReactFlowProvider } from 'reactflow';
import { 
  Hand, 
  MousePointer2, 
  Undo, 
  Redo, 
  ChevronLeft, 
  ChevronRight, 
  PanelLeftClose, 
  PanelLeftOpen, 
  Database, 
  NotebookPen, 
  Activity,
  Save,
  Sparkles,
  StickyNote,
  ArrowLeft,
  Play,
  Square,
  FileText, 
  ChevronDown,
  Trash2,
  Copy,
  Scissors,
  Clipboard,
  Trash,
  ArrowLeftToLine,
  ChevronsLeft,
} from 'lucide-react';
import useBuilderHistoryStore from '../store/historyStore';
import MemoPad from './MemoPad';
import CanvasMemoLayer from './CanvasMemoLayer';
import { MemoCanvasItem } from './CanvasMemoItem';

function ScenarioDetail(props: any) {
  return (
    <ReactFlowProvider>
      <Flow {...props} />
    </ReactFlowProvider>
  );
}

export default ScenarioDetail;