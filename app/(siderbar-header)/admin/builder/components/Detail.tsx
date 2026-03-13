// app/(siderbar-header)/admin/builder/components/Detail.tsx
"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store';
import { useModal } from '@/providers/ModalProvider';

import ReactFlow, { Controls, useReactFlow, MiniMap, Background, MarkerType, Panel, SelectionMode } from 'reactflow';
import 'reactflow/dist/style.css';

import useBuilderStore, { ALL_NODE_TYPES } from '../store/index';
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
    // 20260312 - undo/redo 기능 추가
    undo, redo
  } = useBuilderStore();
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

      <div className={styles.mainContent} ref={reactFlowWrapper}>
        {/* Current Values */}
        {isSlotDisplayVisible && (
          <div
            className={styles.slotDisplayAnchor}
            style={{ top: `${canvasPanelHeight + 24}px` }}
          >
            <SlotDisplay />
          </div>
        )}

        <div className={styles.topRightControls}>
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
          {isAdmin ? (
            <div onClick={() => setIsLogVisible(true)}>
              <img src="/images/log.png" alt="log Icon" className={!isLogVisible ? styles.botButtonHidden : styles.botButton} />
            </div>
          ) : null}
          <div onClick={onClose}>
            <span className={styles.globalColorSettingButton}>
              <IconListBack width="35" height="35" />
            </span>
          </div>
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
          onPaneClick={handlePaneClick}
          onKeyDown={handleKeyDown}
          onDragOver={onDragOver}
          onDrop={onDrop}
          defaultViewport={{ x: 0, y: 0, zoom: 0.1 }}
          fitView
          fitViewOptions={{ padding: 0.2, maxZoom: 1.2 }}

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

                  <button
                    type="button"
                    title="Group Selected Nodes"
                    onClick={handleGroupSelectedNodes}
                    className={styles.toolButton}
                  >
                    G
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
                  <select
                    className={styles.searchSelect}
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
    </div>
  );
}

import { ReactFlowProvider } from 'reactflow';
import { Hand, MousePointer2, Undo, Redo, ChevronLeft, ChevronRight, PanelLeftClose, PanelLeftOpen, Database, } from 'lucide-react';
import useBuilderHistoryStore from '../store/historyStore';

function ScenarioDetail(props: any) {
  return (
    <ReactFlowProvider>
      <Flow {...props} />
    </ReactFlowProvider>
  );
}

export default ScenarioDetail;