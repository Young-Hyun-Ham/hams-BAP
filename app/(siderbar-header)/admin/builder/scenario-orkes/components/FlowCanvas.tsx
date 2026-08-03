import {
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  type Node,
} from 'reactflow';
import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';

import {
  buildTopDownFlow,
  defaultEdgeOptions,
  getStartNode,
  START_NODE_ID,
} from './BuildTopDownFlow';
import { useBuilderStore, makeSnapshot } from '../../store';
import { builderClipboardStore } from '../../store/builderClipboardStore';
import useBuilderHistoryStore from '../../store/historyStore';
import { builderExecutionStore } from '../../store/builderExecutionStore';
import { useBuilderExecution } from '../../components/controllers/hooks/useBuilderExecution';
import ChatbotSimulator from './modals/simulator/ChatbotSimulator';
import BranchSelectionModal from './modals/BranchSelectionModal';
import ExecutionFormInputModal from './modals/ExecutionFormInputModal';
import FlowContextMenu from './context-menu/FlowContextMenu';
import FlowCanvasToolbar from './toolbar/FlowCanvasToolbar';
import { useFlowNodeSearch } from './hooks/useFlowNodeSearch';
import { useExecutionFormInput } from './hooks/useExecutionFormInput';
import { flowEdgeTypes, flowNodeTypes } from './FlowTypes';

import type {
  BuilderEdge,
  BuilderNode,
  ContextMenuState,
  InsertTarget,
  NodeSize,
} from '../types';

import { useModal } from '@/providers/ModalProvider';

type FlowCanvasProps = {
  nodes: BuilderNode[];
  edges: BuilderEdge[];
  selectedNodeId?: string | null;
  onSelectNode: (nodeId: string | null) => void;
  onOpenInsert: (target: InsertTarget) => void;
  addCanvasMemo?: (reactFlowWrapper: RefObject<HTMLDivElement | null>) => void;
  onViewportChange?: (viewport: { x: number; y: number; zoom: number }) => void;
  saveScenario?: (scenario: any) => void;
  onPlay?: (flag: boolean) => void;
};

function FlowCanvas({
  nodes,
  edges,
  selectedNodeId,
  onSelectNode,
  onOpenInsert,
  addCanvasMemo,
  onViewportChange,
  saveScenario,
  onPlay,
}: FlowCanvasProps) {
  const { t } = useTranslation();
  const { showConfirm } = useModal();
  const flowWrapperRef = useRef<HTMLDivElement | null>(null);
  const [nodeSizes, setNodeSizes] = useState<Record<string, NodeSize>>({});

  const {
    scenario,
    nodeColors,
    setSelectedNodeId,
    deleteNodesByIds,
    setNodes,
    setEdges,
    deleteNode,
    onNodesChange,
    onEdgesChange,
    // undo/redo 기능 추가
    undo,
    redo,
  } = useBuilderStore() as any;

  // undo/redo 기능 추가
  const canUndo = useBuilderHistoryStore((state) => state.past.length > 0);
  const canRedo = useBuilderHistoryStore((state) => state.future.length > 0);

  // 플레이 추가
  const {
    runBetweenStartAndAnchor,
    stopExecution,
    executionRunning,
    selectBranchReply,
    cancelBranchReplySelection,
    submitFormInput,
    cancelFormInput,
  } = useBuilderExecution({ nodes, edges } as any);

  const layoutStartNode = useMemo(
    () => getStartNode(nodes, edges, null),
    [edges, nodes],
  );
  const { displayNodes, displayEdges } = useMemo(
    () =>
      buildTopDownFlow({
        nodes,
        edges,
        startNode: layoutStartNode,
        nodeSizes,
        onOpenInsert,
      }),
    [edges, nodeSizes, nodes, onOpenInsert, layoutStartNode],
  );

  const selectedNodes = useMemo(
    () =>
      displayNodes.map((node) => ({
        ...node,
        selected: node.id === selectedNodeId,
      })),
    [displayNodes, selectedNodeId],
  );

  const measureNodeSizes = useCallback(() => {
    const wrapper = flowWrapperRef.current;
    if (!wrapper) return;

    const nextSizes: Record<string, NodeSize> = {};
    const realNodeIds = new Set([
      START_NODE_ID,
      ...nodes.map((node) => node.id),
    ]);

    wrapper
      .querySelectorAll<HTMLElement>('.react-flow__node')
      .forEach((element) => {
        const nodeId = element.getAttribute('data-id');
        if (!nodeId || !realNodeIds.has(nodeId)) return;

        const width = Math.round(element.offsetWidth);
        const height = Math.round(element.offsetHeight);
        if (width > 0 && height > 0) {
          nextSizes[nodeId] = { width, height };
        }
      });

    setNodeSizes((prev) => {
      const prevKeys = Object.keys(prev);
      const nextKeys = Object.keys(nextSizes);
      const isSame =
        prevKeys.length === nextKeys.length &&
        nextKeys.every(
          (key) =>
            prev[key]?.width === nextSizes[key].width &&
            prev[key]?.height === nextSizes[key].height,
        );

      return isSame ? prev : nextSizes;
    });
  }, [nodes]);

  useEffect(() => {
    const wrapper = flowWrapperRef.current;
    if (!wrapper) return;

    const frame = window.requestAnimationFrame(measureNodeSizes);
    const observer = new ResizeObserver(measureNodeSizes);

    wrapper
      .querySelectorAll<HTMLElement>('.react-flow__node')
      .forEach((element) => observer.observe(element));

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [measureNodeSizes, selectedNodes]);

  // =============================================================================
  // right click menu
  // =============================================================================
  const copySelection = builderClipboardStore((state) => state.copySelection);
  const cutSelection = builderClipboardStore((state) => state.cutSelection);
  const pasteClipboard = builderClipboardStore((state) => state.pasteClipboard);
  const clipboard = builderClipboardStore((state) => state.clipboard);

  const pushHistory = useCallback(() => {
    useBuilderHistoryStore
      .getState()
      .push(makeSnapshot(useBuilderStore.getState()));
  }, []);

  const { project, setCenter } = useReactFlow();
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    open: false,
    x: 0,
    y: 0,
    target: null,
  });
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
    menuType: 'pane' | 'node' | 'edge',
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

    const { x, y } = getSafeMenuPosition(event.clientX, event.clientY, 'pane');
    const bounds = flowWrapperRef.current?.getBoundingClientRect();
    const flowPosition = bounds
      ? project({
          x: event.clientX - bounds.left,
          y: event.clientY - bounds.top,
        })
      : null;

    setSelectedNodeId(null);
    onPlay?.(false);
    setContextMenu({
      open: true,
      x,
      y,
      flowPosition,
      target: { type: 'pane' },
    });
  };

  const handleNodeContextMenu = (event: React.MouseEvent, node: Node<any>) => {
    event.preventDefault();
    event.stopPropagation();

    const { x, y } = getSafeMenuPosition(event.clientX, event.clientY, 'node');
    const bounds = flowWrapperRef.current?.getBoundingClientRect();
    const flowPosition = bounds
      ? project({
          x: event.clientX - bounds.left,
          y: event.clientY - bounds.top,
        })
      : null;

    setSelectedNodeId(node.id);
    onPlay?.(false);
    setContextMenu({
      open: true,
      x,
      y,
      flowPosition,
      target: { type: 'node', id: node.id },
    });
  };

  // 선택 대상 계산 helper
  const getTargetNodeIdsForContextMenu = useCallback(
    (targetNodeId?: string) => {
      const selectedIds = nodes
        .filter((node: any) => node.selected)
        .map((node: any) => node.id);

      if (!targetNodeId) return selectedIds;

      if (selectedIds.includes(targetNodeId)) {
        return selectedIds;
      }

      return [targetNodeId];
    },
    [nodes],
  );

  // Node context menu actions
  const handleContextCopyNodes = useCallback(
    (targetNodeId: string) => {
      const targetIds = getTargetNodeIdsForContextMenu(targetNodeId);

      copySelection({
        nodes,
        edges,
        selectedNodeIds: targetIds,
      });

      closeContextMenu();
    },
    [copySelection, edges, getTargetNodeIdsForContextMenu, nodes],
  );

  const handleContextCutNodes = useCallback(
    (targetNodeId: string) => {
      const targetIds = getTargetNodeIdsForContextMenu(targetNodeId);

      cutSelection({
        nodes,
        edges,
        selectedNodeIds: targetIds,
        deleteNodesByIds,
      });

      closeContextMenu();
    },
    [
      cutSelection,
      deleteNodesByIds,
      edges,
      getTargetNodeIdsForContextMenu,
      nodes,
    ],
  );

  const handleContextPaste = useCallback(
    (pastePosition?: { x: number; y: number } | null) => {
      pasteClipboard({
        nodes,
        edges,
        setNodes,
        setEdges,
        pushHistory,
        pastePosition,
        appendToLastNode: true,
      });

      closeContextMenu();
    },
    [edges, nodes, pasteClipboard, pushHistory, setEdges, setNodes],
  );
  // =============================================================================

  // =============================================================================
  // 캔버스 상단 메뉴
  // =============================================================================
  // 캔버스 노드 검색 기능
  const [isCanvasPanelCollapsed, setIsCanvasPanelCollapsed] = useState(false);
  const searchPanelRef = useRef<HTMLDivElement | null>(null);
  const resetExecution = builderExecutionStore((state) => state.resetExecution);
  const [isSimulatorVisible, setIsSimulatorVisible] = useState(false);
  const [isSimulatorExpanded, setIsSimulatorExpanded] = useState(false);

  const {
    searchType,
    setSearchType,
    searchKeyword,
    setSearchKeyword,
    getNodeSearchText,
    filteredSearchResults,
    focusNode,
  } = useFlowNodeSearch({
    nodes,
    setNodes,
    setSelectedNodeId,
    setCenter,
  });
  // =============================================================================

  // =============================================================================
  // play 실행 영역
  // =============================================================================

  const pendingBranchSelection = builderExecutionStore(
    (state) => state.pendingBranchSelection,
  );
  const {
    pendingFormInput,
    executionFormElements,
    executionFormValues,
    updateExecutionFormCheckbox,
    updateExecutionFormValue,
  } = useExecutionFormInput();
  // =============================================================================

  // =============================================================================
  // canvas events 영역
  // =============================================================================

  const handleNodesChange = useCallback(
    (changes: any[]) => {
      onPlay?.(false);
      const realNodeIds = new Set(nodes.map((node) => node.id));

      const realChanges = changes.filter((change) =>
        realNodeIds.has(change.id),
      );

      if (realChanges.length > 0) {
        onNodesChange(realChanges);
      }
    },
    [nodes, onNodesChange],
  );

  const handleEdgesChange = useCallback(
    (changes: any[]) => {
      const realEdgeIds = new Set(edges.map((edge) => edge.id));

      const realChanges = changes.filter((change) =>
        realEdgeIds.has(change.id),
      );

      if (realChanges.length > 0) {
        onEdgesChange(realChanges);
      }
    },
    [edges, onEdgesChange],
  );

  // =============================================================================

  return (
    <>
      <Box
        ref={flowWrapperRef}
        sx={{ flex: 1, minWidth: 0, minHeight: 0, bgcolor: '#fbfcfd' }}
      >
        <ReactFlow
          nodes={selectedNodes}
          edges={displayEdges}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          nodeTypes={flowNodeTypes}
          edgeTypes={flowEdgeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable
          // fitView
          defaultViewport={{ x: 120, y: 56, zoom: 0.9 }}
          fitViewOptions={{ padding: 0.6 }}
          minZoom={0.35}
          maxZoom={1.5}
          onPaneClick={() => {
            onSelectNode(null);
            onPlay?.(false);
            closeContextMenu();
          }}
          onNodeClick={(_, node) => {
            closeContextMenu();

            if (node.type === 'add' || node.type === 'start') return;
            onSelectNode(node.id);
          }}
          // 마우스 우클릭 메뉴 custom 수정
          onPaneContextMenu={handlePaneContextMenu}
          onMove={(_, nextViewport) => onViewportChange?.(nextViewport)}
          onNodeContextMenu={handleNodeContextMenu}
          // onEdgeContextMenu={handleEdgeContextMenu}
        >
          <Background color="#d2d9df" gap={18} size={1.2} />
          <MiniMap
            nodeColor={(n: unknown) =>
              (n as { type: string }).type in nodeColors
                ? nodeColors[(n as { type: string }).type]
                : '#ddd'
            }
            nodeStrokeWidth={3}
            zoomable
            pannable
          />
          <Controls showInteractive={false} />

          <FlowCanvasToolbar
            searchPanelRef={searchPanelRef}
            isCollapsed={isCanvasPanelCollapsed}
            onToggleCollapsed={() => setIsCanvasPanelCollapsed((prev) => !prev)}
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={undo}
            onRedo={redo}
            onSaveScenario={async () => {
              const confirmed = await showConfirm(
                `${t('Do you want to save the Scenario?')}`,
              );
              if (!confirmed) return;
              resetExecution();
              saveScenario?.(scenario);
            }}
            onPushScenario={async () => {
              const confirmed = await showConfirm(
                `${t('Do you want to push the Scenario?')}`,
              );
              if (!confirmed) return;
              resetExecution();
            }}
            isSimulatorVisible={isSimulatorVisible}
            onToggleSimulator={() => setIsSimulatorVisible((prev) => !prev)}
            executionRunning={executionRunning}
            onRun={() => {
              onPlay?.(true);
              runBetweenStartAndAnchor();
            }}
            onStop={() => stopExecution()}
            onShowCurrentValues={() => onPlay?.(true)}
            searchType={searchType}
            onSearchTypeChange={setSearchType}
            searchKeyword={searchKeyword}
            onSearchKeywordChange={setSearchKeyword}
            filteredSearchResults={filteredSearchResults}
            onFocusNode={focusNode}
            getNodeSearchText={getNodeSearchText}
          />
        </ReactFlow>

        <FlowContextMenu
          contextMenu={contextMenu}
          hasClipboard={!!clipboard}
          flowWrapperRef={flowWrapperRef}
          onPaste={handleContextPaste}
          onAddMemo={addCanvasMemo}
          onClose={closeContextMenu}
          onCopyNode={handleContextCopyNodes}
          onCutNode={handleContextCutNodes}
          onDeleteNode={(nodeId) => {
            deleteNode(nodeId);
            closeContextMenu();
          }}
          onSetContextMenu={setContextMenu}
        />

        {/* Execution modals */}
        {/* Branch selection modal */}
        <BranchSelectionModal
          pendingBranchSelection={pendingBranchSelection}
          onCancel={cancelBranchReplySelection}
          onSelectReply={selectBranchReply}
        />

        {/* Form input modal */}
        <ExecutionFormInputModal
          pendingFormInput={pendingFormInput}
          elements={executionFormElements}
          values={executionFormValues}
          onCancel={cancelFormInput}
          onSubmit={submitFormInput}
          onUpdateValue={updateExecutionFormValue}
          onUpdateCheckbox={updateExecutionFormCheckbox}
        />
      </Box>
      <ChatbotSimulator
        nodes={nodes}
        edges={edges}
        isVisible={isSimulatorVisible}
        isExpanded={isSimulatorExpanded}
        setIsExpanded={setIsSimulatorExpanded}
        onClose={() => {
          setIsSimulatorVisible(false);
          setIsSimulatorExpanded(false);
        }}
      />
    </>
  );
}

export default FlowCanvas;
