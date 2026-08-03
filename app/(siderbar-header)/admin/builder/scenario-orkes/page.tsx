'use client';

import { RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ReactFlowProvider, useReactFlow } from 'reactflow';

import 'reactflow/dist/style.css';
import { Box, Button, IconButton, Typography } from '@mui/material';
import { ArrowLeft, Save, Search, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import slotStyles from '../components/SlotDisplay.module.css';
import { createNodeData } from '../utils/nodeFactory';
import { useBuilderStore } from '../store';
import ActivityPickerModal, {
  type ActivityType,
} from './components/modals/ActivityPickerModal';
import NodeController from '../components/NodeController';
import FlowCanvas from './components/FlowCanvas';
import { createWorkflowEdge, panelBorder } from './components/BuildTopDownFlow';
import { MemoCanvasItem } from '../components/CanvasMemoItem';
import CanvasMemoLayer from '../components/CanvasMemoLayer';
import SlotPanel from './components/SlotPanel';
import ScenarioEditModal from '../components/modals/ScenarioEditModal';
import ScenarioNodesSettingModal from '../components/modals/ScenarioNodesSettingModal';
import { createScenario } from '../services/fastApi';

import type {
  BuilderEdge,
  BuilderNode,
  BuilderNodeData,
  InsertTarget,
  ScenarioSummary,
  SidebarMenuData,
} from './types';

import { useModal } from '@/providers/ModalProvider';
import { getSafeUUID } from '../utils/util';

function FlowUiPathPageContent() {
  const { showAlert, showConfirm } = useModal();
  const { t } = useTranslation();
  const router = useRouter();
  const {
    scenario,
    setScenario,
    scenarios,
    setScenarios,
    nodes,
    edges,
    setNodes,
    setEdges,
    selectedNodeId,
    setSelectedNodeId,
    startNodeId,
    fetchScenario,
    fetchScenarios,
    saveScenario,
    patchScenario,

    loadingUserData,
    userInfoJson,
  } = useBuilderStore() as any;
  const setStartNodeId = useBuilderStore((state) => state.setStartNodeId);
  const [insertTarget, setInsertTarget] = useState<InsertTarget | null>(null);
  const [activitySearch, setActivitySearch] = useState('');
  const [recentTypes, setRecentTypes] = useState<ActivityType[]>([
    'message',
    'setSlot',
    'branch',
    'form',
  ]);
  const [play, setPlay] = useState<boolean>(false);
  const [sidebarData, setSidebarData] = useState<SidebarMenuData | null>(null);

  const [scenarioEditOpen, setScenarioEditOpen] = useState(false);
  const [scenarioEditData, setScenarioEditData] = useState<any>(null);

  // node settings
  const [isNodesSettingModalOpen, setIsNodesSettingModalOpen] = useState(false);

  // unuse nodes
  const baseUnuseNodes = Array.isArray(userInfoJson?.unuseNodes)
    ? userInfoJson.unuseNodes
    : [];

  const unuseNodes = insertTarget?.targetId
    ? baseUnuseNodes.includes('branch')
      ? [...baseUnuseNodes]
      : [...baseUnuseNodes, 'branch']
    : [...baseUnuseNodes];

  useEffect(() => {
    if (!scenario?.id) return;
    void fetchScenario(scenario.id);
  }, [fetchScenario, scenario?.id]);

  useEffect(() => {
    const onLoadScenarios = async () => {
      try {
        const data: any = await fetchScenarios({});
        setScenarios(data ?? []);
      } catch (error) {
        console.error('Error fetching rows:', error);
        throw new Error('Failed to fetch');
      }
    };

    const onLoadSettings = async (type: string) => {
      const userInfo = await loadingUserData();
      if (userInfo.unuseNodes?.includes(type)) {
        showAlert(
          `${t('The node does not have modification privileges')}`,
        );
        return;
      }
    };

    onLoadScenarios();
    onLoadSettings('settingNodes');
  }, []);

  const closeActivityPicker = () => {
    setInsertTarget(null);
    setActivitySearch('');
  };

  const openActivityPicker = useCallback(
    async (target: InsertTarget) => {
      setInsertTarget(target);
      setActivitySearch('');
      // if (sidebarData?.isLeaf && sidebarData.isScenario) {
      //   setInsertTarget(target);
      //   setActivitySearch('');
      // } else if (sidebarData?.isLeaf && !sidebarData.isScenario) {
      //   const flag = await showConfirm(
      //     'info',
      //     `${t('No scenario has been created.\nDo you want to create a scenario?')}`,
      //   );
      //   if (flag) {
      //     setScenarioEditOpen(true);
      //   }
      // } else {
      //   showAlert('warning', 'warning', `${t('pgmId does not exist.')}`);
      // }
    },
    [sidebarData],
  );

  useEffect(() => {
    const handleGroupNodeAdd = (event: Event) => {
      const groupId = (event as CustomEvent<{ groupId?: string }>).detail
        ?.groupId;

      if (!groupId) return;
      openActivityPicker({ parentId: groupId });
    };

    window.addEventListener('flow-uipath:add-group-node', handleGroupNodeAdd);

    return () => {
      window.removeEventListener(
        'flow-uipath:add-group-node',
        handleGroupNodeAdd,
      );
    };
  }, [openActivityPicker]);

  const handleSelectActivity = (type: ActivityType) => {
    if (!insertTarget) return;
    if (
      unuseNodes.includes(type) ||
      (type === 'branch' && insertTarget.targetId)
    )
      return;

    const sourceNode = insertTarget.sourceId
      ? nodes.find((node: any) => node.id === insertTarget.sourceId)
      : null;
    const targetNode = insertTarget.targetId
      ? nodes.find((node: any) => node.id === insertTarget.targetId)
      : null;
    const data = createNodeData(type) as BuilderNodeData;
    const parentNode = insertTarget.parentId
      ? nodes.find((node: any) => node.id === insertTarget.parentId)
      : null;
    const position = parentNode
      ? {
          x: 28,
          y:
            88 +
            nodes.filter((node: any) => node.parentNode === parentNode.id)
              .length *
              120,
        }
      : sourceNode && targetNode
        ? {
            x: Math.round((sourceNode.position.x + targetNode.position.x) / 2),
            y: Math.round((sourceNode.position.y + targetNode.position.y) / 2),
          }
        : sourceNode
          ? { x: sourceNode.position.x, y: sourceNode.position.y + 160 }
          : targetNode
            ? {
                x: targetNode.position.x,
                y: Math.max(40, targetNode.position.y - 160),
              }
            : { x: 0, y: 0 };

    const newNode: BuilderNode = {
      id: data.id || `${type}-${Date.now()}`,
      type,
      position,
      parentNode: parentNode?.id,
      extent: parentNode ? 'parent' : undefined,
      data: {
        ...data,
        flowCollapsed: false,
      },
    };
    const insertedNodeNextSourceHandle = type === 'api' ? 'onSuccess' : null;

    if (parentNode) {
      const groupChildren = nodes
        .filter((node: any) => node.parentNode === parentNode.id)
        .slice()
        .sort((a: any, b: any) => (a.position?.y || 0) - (b.position?.y || 0));
      const sourceChild = insertTarget.sourceId
        ? groupChildren.find((node: any) => node.id === insertTarget.sourceId)
        : groupChildren[groupChildren.length - 1];
      const sourceHandle = insertTarget.sourceHandle || null;
      const existingSourceEdge = sourceChild
        ? edges.find(
            (edge: any) =>
              edge.source === sourceChild.id &&
              (edge.sourceHandle || null) === sourceHandle &&
              groupChildren.some((node: any) => node.id === edge.target),
          )
        : null;
      const nextChild = existingSourceEdge
        ? groupChildren.find(
            (node: any) => node.id === existingSourceEdge.target,
          )
        : null;
      const nextEdges = sourceChild
        ? [
            ...edges.filter(
              (edge: any) =>
                !(
                  edge.source === sourceChild.id &&
                  (edge.sourceHandle || null) === sourceHandle &&
                  existingSourceEdge &&
                  edge.target === existingSourceEdge.target
                ),
            ),
            createWorkflowEdge({
              source: sourceChild.id,
              target: newNode.id,
              sourceHandle,
            }),
            ...(nextChild
              ? [
                  createWorkflowEdge({
                    source: newNode.id,
                    target: nextChild.id,
                    sourceHandle: insertedNodeNextSourceHandle,
                  }),
                ]
              : []),
          ]
        : edges;

      setNodes([...nodes, newNode]);
      setEdges(nextEdges);
      setSelectedNodeId(newNode.id);
      setRecentTypes((prev) =>
        [type, ...prev.filter((item) => item !== type)].slice(0, 6),
      );
      closeActivityPicker();
      return;
    }

    const nextEdges = edges.filter((edge: any) => {
      if (!insertTarget.sourceId || !insertTarget.targetId) return true;

      return !(
        edge.source === insertTarget.sourceId &&
        edge.target === insertTarget.targetId &&
        (edge.sourceHandle || null) === (insertTarget.sourceHandle || null)
      );
    });

    if (insertTarget.sourceId) {
      nextEdges.push(
        createWorkflowEdge({
          source: insertTarget.sourceId,
          target: newNode.id,
          sourceHandle: insertTarget.sourceHandle,
        }),
      );
    }

    if (insertTarget.targetId) {
      nextEdges.push(
        createWorkflowEdge({
          source: newNode.id,
          target: insertTarget.targetId,
          sourceHandle: insertedNodeNextSourceHandle,
        }),
      );
    }

    // Flow UiPath insert rule: when a node is added from the picker,
    // collapse every existing node and keep only the newly added node expanded.
    const collapsedExistingNodes = nodes.map((node: any) => ({
      ...node,
      data: {
        ...node.data,
        flowCollapsed:
          node.type === 'branch' || node.type === 'selectionGroup'
            ? false
            : true,
      },
    }));

    setNodes([...collapsedExistingNodes, newNode]);
    setEdges(nextEdges);

    if (!insertTarget.sourceId) {
      setStartNodeId(newNode.id);
    }

    setSelectedNodeId(newNode.id);
    setRecentTypes((prev) =>
      [type, ...prev.filter((item) => item !== type)].slice(0, 6),
    );
    closeActivityPicker();
  };

  // ===========================================================
  // 캔버스 메모 상태 추가
  const { getNodes, project, setCenter } = useReactFlow();
  const [memoNodes, setMemoNodes] = useState<MemoCanvasItem[]>([]);
  const [selectedMemoId, setSelectedMemoId] = useState<string | null>(null);
  const [draggingMemoId, setDraggingMemoId] = useState<string | null>(null);
  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });
  const flowCanvasRef = useRef<RefObject<HTMLDivElement | null> | null>(null);

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

  const addCanvasMemo = (flowWrapperRef: RefObject<HTMLDivElement | null>) => {
    flowCanvasRef.current = flowWrapperRef;
    const bounds = flowWrapperRef.current?.getBoundingClientRect();
    if (!bounds) return;

    const center = project({
      x: bounds.width / 2,
      y: bounds.height / 2,
    });

    setMemoNodes((prev) => [
      ...prev,
      {
        id: getSafeUUID(),
        x: center.x - 120,
        y: center.y - 80,
        backgroundOpacity: 0.9,
        width: 400,
        height: 240,
        text: '',
        backgroundColor: '#fff7c2',
        textColor: '#111827',
        isCollapsed: false,
        zIndex: prev.length + 1,
      },
    ]);
  };

  const clampMemoPosition = useCallback(
    (memo: MemoCanvasItem, nextX: number, nextY: number) => {
      const bounds = flowCanvasRef.current?.current?.getBoundingClientRect();
      if (!bounds) return { x: nextX, y: nextY };

      const topLeft = project({ x: 0, y: 0 });
      const bottomRight = project({ x: bounds.width, y: bounds.height });
      const minX = Math.min(topLeft.x, bottomRight.x);
      const minY = Math.min(topLeft.y, bottomRight.y);
      const maxX = Math.max(
        minX,
        Math.max(topLeft.x, bottomRight.x) - memo.width,
      );
      const memoHeight = memo.isCollapsed ? 42 : memo.height;
      const maxY = Math.max(
        minY,
        Math.max(topLeft.y, bottomRight.y) - memoHeight,
      );

      return {
        x: Math.min(Math.max(nextX, minX), maxX),
        y: Math.min(Math.max(nextY, minY), maxY),
      };
    },
    [project],
  );

  const updateMemoNode = useCallback(
    (id: string, patch: Partial<MemoCanvasItem>) => {
      setMemoNodes((prev) =>
        prev.map((memo) => (memo.id === id ? { ...memo, ...patch } : memo)),
      );
    },
    [],
  );

  const removeMemoNode = useCallback((id: string) => {
    setMemoNodes((prev) => prev.filter((memo) => memo.id !== id));

    setSelectedMemoId((prev) => (prev === id ? null : prev));
  }, []);

  const toggleMemoCollapsed = useCallback((id: string) => {
    setMemoNodes((prev) =>
      prev.map((memo) =>
        memo.id === id ? { ...memo, isCollapsed: !memo.isCollapsed } : memo,
      ),
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
          prev.map((memo) => {
            if (memo.id !== drag.id) return memo;

            const nextPosition = clampMemoPosition(
              memo,
              drag.startX + dx,
              drag.startY + dy,
            );

            return { ...memo, ...nextPosition };
          }),
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
              : memo,
          ),
        );
      }
    };

    const handlePointerUp = () => {
      dragStateRef.current = null;
      resizeStateRef.current = null;
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [clampMemoPosition, viewport.zoom]);

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
  // =============================================================================

  const handleSave = () => {
    // console.log('[nodes]===========================>', nodes);
    // console.log('[edges]===========================>', edges);
    // console.log('[startNodeId]===========================>', startNodeId);
    // console.log('[scenario]===========================>', scenario);
    const payload = {
      ...scenario,
      nodes,
      edges,
      startNodeId,
    };
    // console.log('[payload]===========================>', payload);
    // setScenario(payload);
    if (!scenario?.id) return;

    handleSaveScenario(payload);
  };

  const handleSaveScenario = async (nextScenario: any) => {
    const payload = { ...nextScenario };
    if (payload.id) delete payload.name;
    if (!payload.id) {
      delete payload.nodes;
      delete payload.edges;
      delete payload.start_node_id;
      delete payload.startNodeId;
      delete payload.ltst_ver_id;
      delete payload.depn_ver_id;
      // console.log('payload save =====================>', payload);
      const postData = await createScenario(payload);
      setScenario(postData);
      // console.log('postData =====================>', postData);
      return;
    }
    try {
      const patchData = await patchScenario(payload);
      // console.log('nextScenario save =====================>', nextScenario);
      // console.log('patch save =====================>', patchData);

      const updatedScenario = {
        ...nextScenario,
        ...payload,
      };

      setScenarioEditData(updatedScenario);

      if (scenario?.id === updatedScenario.id) {
        setScenario({
          ...scenario,
          ...updatedScenario,
        });
      }

      setSidebarData((prev: any) =>
        prev?.scenarioData?.id === updatedScenario.id
          ? {
              ...prev,
              scenarioData: {
                ...prev.scenarioData,
                ...updatedScenario,
              },
            }
          : { ...prev },
      );
      showAlert(`${t('success')}`);
    } catch (e) {
      showAlert(`${t('error')}`);
    }
  };

  const handleMoveVersionView = (scenario?: any) => {
    // console.log("handleMoveVersionView =================> ", scenario)
    if (scenario?.id) {
      setScenario(scenario);
      setEdges([]);
      setStartNodeId(null);
      router.push(`/builder/react-flow/scenario-view`);
    }
  };

  return (
    <Box
      sx={{
        height: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#fff',
        border: `1px solid ${panelBorder}`,
      }}
    >
      <Box
        sx={{
          height: 48,
          borderBottom: `1px solid ${panelBorder}`,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 1,
          flexShrink: 0,
        }}
      >
        {/* <IconButton
          size="small"
          onClick={() => router.push('/builder/react-flow/scenario-list')}
        >
          <ArrowLeft size={18} />
        </IconButton> */}
        <Typography
          sx={{
            flex: 1,
            fontSize: 14,
            fontWeight: 700,
            color: '#26323d',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {scenario?.name ? 'Selected Scenario Title : ' : ''}
          {scenario?.name || scenario?.scenario_nm || ''}
        </Typography>
        <IconButton
          size="small"
          aria-label="settings"
          onClick={() => setIsNodesSettingModalOpen(true)}
        >
          <Settings size={18} />
        </IconButton>
        {/* top button hidden
        <IconButton size="small" aria-label="Search">
          <Search size={18} />
        </IconButton>
        <Button
          size="small"
          variant="contained"
          startIcon={<Save size={16} />}
          onClick={handleSave}
          sx={{ height: 32, borderRadius: 1, textTransform: 'none' }}
        >
          {t('Save')}
        </Button>
        */}
      </Box>

      {/* node settings */}
      <ScenarioNodesSettingModal
        isOpen={isNodesSettingModalOpen}
        onClose={() => setIsNodesSettingModalOpen(false)}
      />

      <Box sx={{ flex: 1, minHeight: 0, display: 'flex' }}>
        <Box
          sx={{
            position: 'relative',
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            display: 'flex',
            overflow: 'hidden',
          }}
        >
          <FlowCanvas
            nodes={nodes}
            edges={edges}
            selectedNodeId={selectedNodeId}
            onSelectNode={setSelectedNodeId}
            onOpenInsert={openActivityPicker}
            addCanvasMemo={addCanvasMemo}
            onViewportChange={setViewport}
            saveScenario={handleSave}
            onPlay={setPlay}
          />

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
        </Box>
        <Box
          sx={{
            width: selectedNodeId || play ? 420 : 0,
            flexShrink: 0,
            overflow: 'hidden',
            borderLeft:
              selectedNodeId || play ? `1px solid ${panelBorder}` : 'none',
            transition: 'width 160ms ease',
            bgcolor: '#fff',
          }}
        >
          {play ? <SlotPanel /> : selectedNodeId ? <NodeController /> : null}
        </Box>
        <ActivityPickerModal
          open={Boolean(insertTarget)}
          search={activitySearch}
          recentTypes={recentTypes}
          hiddenTypes={
            userInfoJson.unuseNodes && !insertTarget?.targetId
              ? userInfoJson.unuseNodes
              : insertTarget?.targetId
                ? unuseNodes
                : []
          }
          onSearchChange={setActivitySearch}
          onClose={closeActivityPicker}
          onSelect={handleSelectActivity}
        />

        <ScenarioEditModal
          open={scenarioEditOpen}
          scenario={scenarioEditData}
          onClose={() => setScenarioEditOpen(false)}
          onSave={handleSaveScenario}
          onVersionView={handleMoveVersionView}
        />
      </Box>
    </Box>
  );
}

export default function FlowUiPathPage() {
  return (
    <ReactFlowProvider>
      <FlowUiPathPageContent />
    </ReactFlowProvider>
  );
}
