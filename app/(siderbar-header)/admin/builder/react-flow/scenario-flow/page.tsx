/* eslint-disable jsx-a11y/no-static-element-interactions */

'use client';

import { useTranslation } from 'react-i18next';

import { getSafeUUID } from '../../utils/util';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import ReactFlow, {
  Controls,
  ControlButton,
  useReactFlow,
  MiniMap,
  Background,
  MarkerType,
  Panel,
  SelectionMode,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useAutoLayout } from '@/components/graph/useAutoLayout';

import {
  Box,
  Checkbox,
  FormControl,
  FormControlLabel,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  TextField,
  Button,
  Typography,
  Stack,
  Backdrop,
  CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
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
  ChevronDown,
  NotebookPen,
  Activity,
  Save,
  Sparkles,
  StickyNote,
  ArrowLeft,
  Play,
  Square,
  FileText,
  Trash2,
  Copy,
  Scissors,
  Clipboard,
  Trash,
  ArrowLeftToLine,
  ChevronsLeft,
  SendIcon,
  Plus,
  GitFork,
  LayoutGrid,
} from 'lucide-react';

import useBuilderHistoryStore from '../../store/historyStore';
import {
  useBuilderStore,
  ALL_NODE_TYPES,
  makeSnapshot,
  MOCK_UP_TREE_DATA,
  type StoreState,
} from '../../store/index';
import { sanitizeEdgesForSave } from '../../store/edgeControlActionStore';
import { fetchScenarioData } from '../../services/backendService';
import styles from '../../components/Detail.module.css';
import MessageNode from '../../components/nodes/MessageNode';
import BranchNode from '../../components/nodes/BranchNode';
import SlotFillingNode from '../../components/nodes/SlotFillingNode';
import ApiNode from '../../components/nodes/ApiNode';
import FormNode from '../../components/nodes/FormNode';
import FixedMenuNode from '../../components/nodes/FixedMenuNode';
import LinkNode from '../../components/nodes/LinkNode';
import LlmNode from '../../components/nodes/LlmNode';
import ToastNode from '../../components/nodes/ToastNode';
import IframeNode from '../../components/nodes/IframeNode';
import ScenarioNode from '../../components/nodes/ScenarioNode';
import SetSlotNode from '../../components/nodes/SetSlotNode';
import DelayNode from '../../components/nodes/DelayNode';
import GroupNode from '../../components/nodes/GroupNode';
import YnBranchNode from '../../components/nodes/YnBranchNode';
import SlotDisplay from '../../components/SlotDisplay';
import NodeController from '../../components/NodeController';
import NodesTreeUI from '../../components/NodesTreeUI';
import ChatbotSimulator from '../../components/ChatbotSimulator';

import '@reactflow/node-resizer/dist/style.css';
import CustomOrthogonalEdge from '../../components/edges/CustomOrthogonalEdge';
import FlowCanvas from '../../scenario-orkes/components/FlowCanvas';
import { createWorkflowEdge } from '../../scenario-orkes/components/BuildTopDownFlow';

// 플레이(실행) 스토어
import { useBuilderExecution } from '../../components/controllers/hooks/useBuilderExecution';
import { builderExecutionStore } from '../../store/builderExecutionStore';
// 클립보드 스토어
import { builderClipboardStore } from '../../store/builderClipboardStore';
import MemoPad from '../../components/MemoPad';
import CanvasMemoLayer from '../../components/CanvasMemoLayer';
import { MemoCanvasItem } from '../../components/CanvasMemoItem';
import ScenarioGroupModal from '../../components/modals/ScenarioGroupModal';
import ScenarioNodesSettingModal from '../../components/modals/ScenarioNodesSettingModal';
import LogPreview from '../../components/modals/LogPreview';
import {
  BuilderNode,
  BuilderNodeData,
  InsertTarget,
  Scenario,
  TreeItem,
} from '../../types/types';
import ActivityPickerModal, {
  ActivityType,
} from '../../components/modals/ActivityPickerModal';
import { createNodeData } from '../../utils/nodeFactory';

import type { Edge, Node } from 'reactflow';

import {
  mapResponseToTargetElement,
  parseOptionalParameter,
} from '../../form-builder/components/CustomElementPropertyEditor';
import apiClient from '@/lib/api/apiClient';
import { useModal } from '@/providers/ModalProvider';
import { COLORS } from '@/lib/constants/color';
import { alignScenarioNodes } from './autoLayout';

const DEFAULT_FORM_API_HEADERS = `{
  "Content-Type":"application/json",
  "Accept":"application/json",
  "X-API-KEY":"6458f478e47abbea0079a1fe7e5f1417",
  "X-TEN-ID":"2000"
}`;

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
  ynBranch: YnBranchNode,
} as const;

const edgeTypes = {
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

type ToolMode = 'pan' | 'select';

type LayerMenuState = {
  open: boolean;
  x: number;
  y: number;
};

type MenuTarget =
  | { type: 'pane' }
  | { type: 'node'; id: string }
  | { type: 'edge'; id: string };

type ContextMenuState = {
  open: boolean;
  x: number;
  y: number;
  flowPosition?: { x: number; y: number } | null;
  target: any;
};

type ExecutionFormElement = {
  id?: string;
  name?: string;
  type?: string;
  label?: string;
  placeholder?: string;
  options?: Array<string | { label?: string; value?: string }>;
  optionsSlot?: string;
  selectKind?: 'single' | 'multi';
  defaultValue?: unknown;
  apiData?: Record<string, unknown> | null;
  eventType?: 'onChange' | 'onClick' | '';
  parameterId?: string;
  optionalParameter?: string;
  targetElementId?: string;
  responsePath?: string;
  rows?: number;
  columns?: number;
  data?: unknown[];
  displayKeys?: Array<string | { key?: string; label?: string }>;
  hideNullColumns?: boolean;
};

type ExecutionFormOption = string | { label?: string; value?: string };

const normalizeExecutionFormOption = (
  option: ExecutionFormOption,
  index: number,
) => {
  if (typeof option === 'object' && option !== null) {
    const value = String(option.value ?? option.label ?? index);
    return {
      value,
      label: String(option.label ?? option.value ?? value),
    };
  }

  const value = String(option ?? index);
  return {
    value,
    label: value,
  };
};

const getExecutionElementKey = (element: ExecutionFormElement, index: number) =>
  element.name?.trim() || element.id || `${element.type || 'element'}-${index}`;

const getGridDisplayColumns = (
  element: ExecutionFormElement,
  rows: Record<string, unknown>[],
) => {
  const sourceColumns =
    element.displayKeys && element.displayKeys.length > 0
      ? element.displayKeys
      : Object.keys(rows[0] || {});

  const columns = sourceColumns
    .map((column) => {
      if (typeof column === 'string') {
        return { key: column, label: column };
      }

      if (column?.key) {
        return { key: column.key, label: column.label || column.key };
      }

      return null;
    })
    .filter(Boolean) as Array<{ key: string; label: string }>;

  if (!element.hideNullColumns) return columns;

  return columns.filter((column) =>
    rows.some((row) => {
      const value = row[column.key];
      return value !== null && value !== undefined && value !== '';
    }),
  );
};

const Flow = ({ scenario, scenarios }: any) => {
  const { t } = useTranslation();
  const router = useRouter();
  const { showAlert, showConfirm } = useModal();
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    fetchScenario,
    saveScenario,
    addNode,
    setNodes,
    setEdges,
    selectedNodeId,
    setSelectedNodeId,
    duplicateNode,
    deleteSelectedEdges,
    nodeColors,
    exportSelectedNodes,
    visibleNodeTypes,
    startNodeId,
    deleteNode,
    deleteNodesByIds,
    addScenarioAsGroup,
    // 그룹노드 추가
    groupSelectedNodes,
    // undo/redo 기능 추가
    undo,
    redo,
    loadingUserData,
    backend,
  } = useBuilderStore() as StoreState;

  interface ScenarioTab {
    id: string;
    name: string;
    nodes: Node<any>[];
    edges: Edge<any>[];
    startNodeId: string | null;
    selectedNodeId: string | null;
    scenario: any;
  }

  const [tabs, setTabs] = useState<ScenarioTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>('');
  const [viewMode, setViewMode] = useState<'flow' | 'orkes'>('flow');

  const formattedEdges = useMemo(() => {
    return edges.map((edge: Edge) => {
      const sourceNode = nodes.find((n: Node) => n.id === edge.source);
      if (!sourceNode) return edge;

      let computedLabel: string | undefined = undefined;

      if (sourceNode.type === 'branch') {
        const isConditionType = sourceNode.data?.evaluationType === 'CONDITION';

        if (isConditionType) {
          const conds = sourceNode.data?.conditions || [];
          if (edge.sourceHandle === 'default') {
            computedLabel = 'Default';
          } else {
            const index = conds.findIndex(
              (c: any, idx: number) =>
                (c.id || idx) === edge.sourceHandle ||
                c.slot === edge.sourceHandle ||
                String(c.id) === String(edge.sourceHandle) ||
                sourceNode.data?.replies?.[idx]?.value === edge.sourceHandle,
            );
            if (index !== -1) {
              computedLabel = String(index + 1);
            } else {
              const branchEdges = edges.filter(
                (e) => e.source === sourceNode.id,
              );
              const edgeIdx = branchEdges.findIndex((e) => e.id === edge.id);
              if (edgeIdx !== -1) {
                computedLabel = String(edgeIdx + 1);
              }
            }
          }
        } else {
          const replies = sourceNode.data?.replies || [];
          const index = replies.findIndex(
            (r: any) => String(r.value) === String(edge.sourceHandle),
          );
          if (index !== -1) {
            computedLabel = String(index + 1);
          } else {
            const branchEdges = edges.filter((e) => e.source === sourceNode.id);
            const edgeIdx = branchEdges.findIndex((e) => e.id === edge.id);
            if (edgeIdx !== -1) {
              computedLabel = String(edgeIdx + 1);
            }
          }
        }
      } else if (sourceNode.type === 'ynBranch') {
        if (edge.sourceHandle === 'Y') computedLabel = 'Y';
        else if (edge.sourceHandle === 'N') computedLabel = 'N';
      } else if (sourceNode.type === 'llm') {
        const conds = sourceNode.data?.conditions || [];
        if (edge.sourceHandle === 'default') {
          computedLabel = 'Default';
        } else {
          const index = conds.findIndex(
            (c: any, idx: number) =>
              (c.id || idx) === edge.sourceHandle ||
              String(c.id) === String(edge.sourceHandle),
          );
          if (index !== -1) {
            computedLabel = String(index + 1);
          }
        }
      }

      if (computedLabel !== undefined) {
        return {
          ...edge,
          label: computedLabel,
          data: {
            ...(edge.data || {}),
            label: computedLabel,
          },
        };
      }

      return edge;
    });
  }, [edges, nodes]);

  const tabsRef = useRef(tabs);
  useEffect(() => {
    tabsRef.current = tabs;
  }, [tabs]);

  useEffect(() => {
    if (scenario?.id && tabs.length === 0) {
      const mainTab: ScenarioTab = {
        id: scenario.id,
        name: scenario.name || scenario.scenario_nm || 'Main Scenario',
        nodes: nodes,
        edges: edges,
        startNodeId: startNodeId,
        selectedNodeId: selectedNodeId,
        scenario: scenario,
      };
      const timer = setTimeout(() => {
        setTabs([mainTab]);
        setActiveTabId(scenario.id);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [scenario, tabs.length, nodes, edges, startNodeId, selectedNodeId]);

  useEffect(() => {
    if (!activeTabId) return;
    if (activeTabId !== scenario?.id) return;
    const timer = setTimeout(() => {
      setTabs((prevTabs) =>
        prevTabs.map((tab) =>
          tab.id === activeTabId
            ? {
                ...tab,
                nodes,
                edges,
                startNodeId,
                selectedNodeId,
              }
            : tab,
        ),
      );
    }, 0);
    return () => clearTimeout(timer);
  }, [nodes, edges, startNodeId, selectedNodeId, activeTabId, scenario?.id]);

  const handleTabSwitch = (targetTabId: string) => {
    const currentTabs = tabsRef.current;
    const targetTab = currentTabs.find((t) => t.id === targetTabId);
    if (!targetTab) return;

    const updatedTabs = currentTabs.map((t) =>
      t.id === activeTabId
        ? {
            ...t,
            nodes,
            edges,
            startNodeId,
            selectedNodeId,
          }
        : t,
    );
    setTabs(updatedTabs);

    useBuilderStore.setState({
      nodes: targetTab.nodes,
      edges: targetTab.edges,
      startNodeId: targetTab.startNodeId,
      selectedNodeId: targetTab.selectedNodeId,
      scenario: targetTab.scenario,
    } as Partial<StoreState>);

    setActiveTabId(targetTabId);
  };

  const handleOpenScenarioTab = useCallback(
    async (subScenario: any) => {
      const currentTabs = tabsRef.current;
      const existingTab = currentTabs.find((t) => t.id === subScenario.id);
      if (existingTab) {
        const updatedTabs = currentTabs.map((t) =>
          t.id === activeTabId
            ? {
                ...t,
                nodes,
                edges,
                startNodeId,
                selectedNodeId,
              }
            : t,
        );
        setTabs(updatedTabs);

        useBuilderStore.setState({
          nodes: existingTab.nodes,
          edges: existingTab.edges,
          startNodeId: existingTab.startNodeId,
          selectedNodeId: existingTab.selectedNodeId,
          scenario: existingTab.scenario,
        } as Partial<StoreState>);
        setActiveTabId(existingTab.id);
        return;
      }

      try {
        const data = await fetchScenarioData(backend, subScenario.id);
        if (data) {
          const updatedTabs = currentTabs.map((t) =>
            t.id === activeTabId
              ? {
                  ...t,
                  nodes,
                  edges,
                  startNodeId,
                  selectedNodeId,
                }
              : t,
          );

          const loadedNodes = data.nodes ?? [];
          const cleanEdges = sanitizeEdgesForSave(
            data.edges ?? [],
            loadedNodes,
          );

          const newTab: ScenarioTab = {
            id: subScenario.id,
            name: subScenario.name || subScenario.scenario_nm || 'Sub Scenario',
            nodes: loadedNodes,
            edges: cleanEdges,
            startNodeId: data.startNodeId ?? null,
            selectedNodeId: null,
            scenario: data,
          };

          setTabs([...updatedTabs, newTab]);

          useBuilderStore.setState({
            nodes: newTab.nodes,
            edges: newTab.edges,
            startNodeId: newTab.startNodeId,
            selectedNodeId: newTab.selectedNodeId,
            scenario: newTab.scenario,
          } as Partial<StoreState>);
          setActiveTabId(newTab.id);
        }
      } catch (e) {
        console.error(e);
        alert('Failed to load sub scenario');
      }
    },
    [backend, activeTabId, nodes, edges, startNodeId, selectedNodeId],
  );

  const handleTabClose = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length <= 1) return;

    const index = tabs.findIndex((t) => t.id === tabId);
    if (index === -1) return;

    const newTabs = tabs.filter((t) => t.id !== tabId);
    setTabs(newTabs);

    if (activeTabId === tabId) {
      const nextActiveTab = newTabs[Math.max(0, index - 1)];
      useBuilderStore.setState({
        nodes: nextActiveTab.nodes,
        edges: nextActiveTab.edges,
        startNodeId: nextActiveTab.startNodeId,
        selectedNodeId: nextActiveTab.selectedNodeId,
        scenario: nextActiveTab.scenario,
      } as Partial<StoreState>);
      setActiveTabId(nextActiveTab.id);
    }
  };

  useEffect(() => {
    const handleOpenTabEvent = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.scenario) {
        handleOpenScenarioTab(customEvent.detail.scenario);
      }
    };

    window.addEventListener('flow:open-scenario-tab', handleOpenTabEvent);
    return () => {
      window.removeEventListener('flow:open-scenario-tab', handleOpenTabEvent);
    };
  }, [handleOpenScenarioTab]);

  // undo/redo 기능 추가
  const canUndo = useBuilderHistoryStore((state) => state.past.length > 0);
  const canRedo = useBuilderHistoryStore((state) => state.future.length > 0);

  const { getNodes, project, setCenter } = useReactFlow();
  const reactFlowWrapper = useRef<HTMLDivElement | null>(null);

  const [toolMode, setToolMode] = useState<ToolMode>('pan');
  const isPanMode = toolMode === 'pan';
  const isSelectMode = toolMode === 'select';

  const selectedNodesCount = useMemo(
    () => nodes.filter((n: any) => n.selected).length,
    [nodes],
  );

  const [rightPanelWidth, setRightPanelWidth] = useState(400);
  const [isSimulatorVisible, setIsSimulatorVisible] = useState(false);
  const [isColorSettingsVisible, setIsColorSettingsVisible] = useState(false);
  const [isSimulatorExpanded, setIsSimulatorExpanded] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  // Scenario Group을 드롭한 캔버스 좌표
  const [scenarioGroupDropPosition, setScenarioGroupDropPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const [isNodesSettingModalOpen, setIsNodesSettingModalOpen] = useState(false);

  const [isLogVisible, setIsLogVisible] = useState(false);

  // 캔버스 노드 다중 선택
  const [selectedNodes, setSelectedNodes] = useState<any[]>([]);
  // 캔버스 노드 검색 기능
  const [searchType, setSearchType] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  // 캔버스 패널 접기/펼치기 상태
  const [isCanvasPanelCollapsed, setIsCanvasPanelCollapsed] = useState(false);
  // 에뮬 실행 데이터 표시 패널 상태 ( 캔버스 패널 height 조정 위해 별도 상태로 분리 )
  const [isSlotDisplayVisible, setIsSlotDisplayVisible] = useState(false);
  const [canvasPanelHeight, setCanvasPanelHeight] = useState(0);
  const searchPanelRef = useRef<HTMLDivElement | null>(null);
  // Node Library 접힘 상태 (orkes 일때 자동 접힘, flow 일때 자동 펼침)
  const [isNodeLibraryCollapsed, setIsNodeLibraryCollapsed] = useState<
    boolean | null
  >(null);

  // viewMode 변경 시 node library 접힘/펼침 조절
  const handleViewModeChange = (mode: 'flow' | 'orkes') => {
    setViewMode(mode);
    setIsNodeLibraryCollapsed(mode === 'orkes');
  };

  // 좌측 노드 패널 옵션
  // isMenuView - 노드가 없을 경우 노드 패널 활설화(새로생성), 상세보기 노드 패널 숨김.
  const nodeTreeUIOptions = useMemo(() => {
    return {
      isMenuView: nodes.length === 0 ? false : isSimulatorVisible,
      isCollapsed:
        isNodeLibraryCollapsed !== null
          ? isNodeLibraryCollapsed
          : nodes.length === 0
            ? false
            : isSimulatorVisible,
      onToggleCollapse: (collapsed: boolean) =>
        setIsNodeLibraryCollapsed(collapsed),
    };
  }, [nodes, isSimulatorVisible, isNodeLibraryCollapsed]);

  const [isLoadingScenario, setIsLoadingScenario] = useState<boolean>(true);

  useEffect(() => {
    const onload = async () => {
      if (scenario && !selectedVersion) {
        setIsLoadingScenario(true);
        try {
          await fetchScenario(scenario.id);
        } finally {
          setIsLoadingScenario(false);
        }
      } else {
        setIsLoadingScenario(false);
      }
    };

    onload();
  }, []);

  // 20260316 - 플레이 추가
  const {
    runBetweenStartAndAnchor,
    stopExecution,
    executionRunning,
    selectBranchReply,
    cancelBranchReplySelection,
    submitFormInput,
    cancelFormInput,
  } = useBuilderExecution({ nodes, edges } as any);

  const pendingBranchSelection = builderExecutionStore(
    (state) => state.pendingBranchSelection,
  );
  const pendingFormInput = builderExecutionStore(
    (state) => state.pendingFormInput,
  );
  const [executionFormElements, setExecutionFormElements] = useState<
    ExecutionFormElement[]
  >([]);
  const [executionFormValues, setExecutionFormValues] = useState<
    Record<string, unknown>
  >({});

  useEffect(() => {
    if (!pendingFormInput) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setExecutionFormElements([]);
      setExecutionFormValues({});
      return;
    }

    setExecutionFormElements(
      (
        (pendingFormInput.elements as ExecutionFormElement[] | undefined) ?? []
      ).filter(Boolean),
    );
    setExecutionFormValues(pendingFormInput.initialValues ?? {});
  }, [pendingFormInput]);

  const getExecutionElementKeyByElement = useCallback(
    (element: ExecutionFormElement) => {
      const index = executionFormElements.findIndex(
        (item) => item === element || item.id === element.id,
      );
      return getExecutionElementKey(element, Math.max(index, 0));
    },
    [executionFormElements],
  );

  const buildExecutionFormApiPayload = useCallback(
    (
      sourceElement: ExecutionFormElement,
      nextValues: Record<string, unknown>,
    ) => {
      const sourceValues: Record<string, unknown> = {
        ...(pendingFormInput?.slots ?? {}),
      };

      executionFormElements.forEach((item, index) => {
        const key = getExecutionElementKey(item, index);
        const value =
          nextValues[key] ??
          (item.name ? nextValues[item.name] : undefined) ??
          (item.id ? nextValues[item.id] : undefined) ??
          item.defaultValue ??
          '';

        if (item.id) sourceValues[item.id] = value;
        if (item.name) sourceValues[item.name] = value;
      });

      const sourceKey = getExecutionElementKeyByElement(sourceElement);
      const sourceValue = nextValues[sourceKey] ?? '';
      sourceValues.value = sourceValue;

      let payload: Record<string, unknown> = {};
      try {
        payload = parseOptionalParameter(
          sourceElement.optionalParameter,
          sourceValues,
        );
      } catch (error) {
        console.warn('Invalid Optional Parameter JSON:', error);
      }

      return payload;
    },
    [
      executionFormElements,
      getExecutionElementKeyByElement,
      pendingFormInput?.slots,
    ],
  );

  const applyExecutionApiResponseToTarget = useCallback(
    (sourceElement: ExecutionFormElement, response: unknown) => {
      if (!sourceElement.targetElementId) return;

      setExecutionFormElements((prev) => {
        const targetElement = prev.find(
          (item) => item.id === sourceElement.targetElementId,
        );
        if (!targetElement) return prev;

        const mappedTarget = mapResponseToTargetElement(
          targetElement as any,
          response,
          sourceElement.responsePath,
        ) as ExecutionFormElement;

        const targetIndex = Math.max(
          prev.findIndex((item) => item.id === targetElement.id),
          0,
        );
        const targetKey = getExecutionElementKey(targetElement, targetIndex);

        setExecutionFormValues((currentValues) => {
          if (!(targetKey in currentValues)) return currentValues;

          const allowedValues = new Set(
            (mappedTarget.options ?? []).map((option, index) => {
              if (option && typeof option === 'object') {
                return String(option.value ?? option.label ?? index + 1);
              }
              return String(option ?? '');
            }),
          );
          const currentValue = currentValues[targetKey];
          const isStillValid = Array.isArray(currentValue)
            ? currentValue.every((item) => allowedValues.has(String(item)))
            : allowedValues.has(String(currentValue));

          return isStillValid
            ? currentValues
            : { ...currentValues, [targetKey]: '' };
        });

        return prev.map((item) =>
          item.id === mappedTarget.id ? mappedTarget : item,
        );
      });
    },
    [],
  );

  const runExecutionFormElementApi = useCallback(
    async (
      element: ExecutionFormElement,
      nextValues: Record<string, unknown>,
    ) => {
      const endpoint =
        typeof element.apiData?.endPoint === 'string'
          ? element.apiData.endPoint.trim()
          : '';
      if (!endpoint || !element.targetElementId) return;

      const method =
        typeof element.apiData?.method === 'string'
          ? element.apiData.method.toLowerCase()
          : 'get';
      const headersText =
        typeof element.apiData?.headers === 'string' &&
        element.apiData.headers.trim()
          ? element.apiData.headers.trim()
          : DEFAULT_FORM_API_HEADERS;

      try {
        const headers = JSON.parse(headersText);
        const payload = buildExecutionFormApiPayload(element, nextValues);
        const parameterKey = element.parameterId?.trim();
        const sourceKey = getExecutionElementKeyByElement(element);
        const parameterParams = parameterKey
          ? {
              [parameterKey]: nextValues[sourceKey] ?? '',
            }
          : {};
        const clientMethod = apiClient[
          method as keyof typeof apiClient
        ] as unknown as (...args: any[]) => Promise<unknown>;

        if (typeof clientMethod !== 'function') return;

        const response =
          method === 'get' || method === 'delete'
            ? await clientMethod(endpoint, {
                params: {
                  ...payload,
                  ...parameterParams,
                },
                headers,
              })
            : await clientMethod(endpoint, payload, {
                params: parameterParams,
                headers,
              });

        applyExecutionApiResponseToTarget(element, response);
      } catch (error) {
        console.error('Execution form onchange API call failed:', error);
      }
    },
    [
      applyExecutionApiResponseToTarget,
      buildExecutionFormApiPayload,
      getExecutionElementKeyByElement,
    ],
  );

  const updateExecutionFormValue = useCallback(
    (name: string, value: unknown, element?: ExecutionFormElement) => {
      setExecutionFormValues((prev) => {
        const nextValues = {
          ...prev,
          [name]: value,
        };

        if (element?.eventType === 'onChange') {
          void runExecutionFormElementApi(element, nextValues);
        }

        return nextValues;
      });
    },
    [runExecutionFormElementApi],
  );

  const updateExecutionFormCheckbox = useCallback(
    (
      name: string,
      value: string,
      checked: boolean,
      element?: ExecutionFormElement,
    ) => {
      setExecutionFormValues((prev) => {
        const current = Array.isArray(prev[name]) ? prev[name] : [];
        const nextValues = {
          ...prev,
          [name]: checked
            ? [...current, value]
            : current.filter((item) => item !== value),
        };

        if (element?.eventType === 'onChange') {
          void runExecutionFormElementApi(element, nextValues);
        }

        return nextValues;
      });
    },
    [runExecutionFormElementApi],
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
  // 메모 패드 상태 추가
  const [isMemoVisible, setIsMemoVisible] = useState(false);
  const [memos, setMemos] = useState([
    {
      id: getSafeUUID(),
      text: '',
      backgroundColor: '#fff7c2',
      textColor: '#111827',
    },
  ]) as any[];
  // ===========================================================

  // ===========================================================
  // 캔버스 메모 상태 추가
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
          prev.map((memo) =>
            memo.id === drag.id
              ? { ...memo, x: drag.startX + dx, y: drag.startY + dy }
              : memo,
          ),
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
  // 마우스 우 클릭 메뉴
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    open: false,
    x: 0,
    y: 0,
    target: null,
  });

  const deleteEdge = (edgeId: string) => {
    const updateEdges = edges.filter((edge: any) => edge.id !== edgeId);
    setEdges(updateEdges);
  };

  const handleAddYNBranchNode = (edgeId: string) => {
    const targetEdge = edges.find((edge: any) => edge.id === edgeId);
    if (!targetEdge) return;

    const sourceNode = nodes.find((node: any) => node.id === targetEdge.source);
    const targetNode = nodes.find((node: any) => node.id === targetEdge.target);

    let posX = contextMenu.flowPosition?.x ?? 0;
    let posY = contextMenu.flowPosition?.y ?? 0;

    if (!contextMenu.flowPosition && sourceNode && targetNode) {
      posX = (sourceNode.position.x + targetNode.position.x) / 2;
      posY = (sourceNode.position.y + targetNode.position.y) / 2;
    } else if (!contextMenu.flowPosition && sourceNode) {
      posX = sourceNode.position.x + 200;
      posY = sourceNode.position.y;
    }

    const newNodeId = `ynBranch-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const replyYId = 'Y';
    const replyNId = 'N';

    const newNodeData = {
      ...createNodeData('branch'),
      id: newNodeId,
      label: 'Y/N Branch',
      isSimpleYN: true,
      content: 'Y/N 분기',
      evaluationType: 'BUTTON',
      replies: [
        { display: 'Y', value: replyYId },
        { display: 'N', value: replyNId },
      ],
    };

    const newNode: Node = {
      id: newNodeId,
      type: 'ynBranch',
      position: { x: posX, y: posY },
      data: newNodeData,
    };

    const targetNodeInputPos =
      targetNode?.data?.inputPosition === 'top' ? 'input-top' : 'input-left';

    // 1) Source -> ynBranch (Input handle on West/Left)
    const edgeToBranch: Edge = {
      id: `edge-${targetEdge.source}-${newNodeId}-${Date.now()}`,
      source: targetEdge.source,
      target: newNodeId,
      sourceHandle: targetEdge.sourceHandle,
      targetHandle: 'input-left',
      type: targetEdge.type || 'orthogonal',
      animated: false,
      markerEnd: targetEdge.markerEnd || {
        type: MarkerType.ArrowClosed,
        color: '#cbd5e1',
      },
      style: targetEdge.style || {
        stroke: '#b8c2cc',
        strokeWidth: 1.4,
      },
    };

    // 2) ynBranch (Horizontal / Right handle 'Y') -> Target Node
    const edgeFromY: Edge = {
      id: `edge-${newNodeId}-${targetEdge.target}-${Date.now() + 1}`,
      source: newNodeId,
      target: targetEdge.target,
      sourceHandle: replyYId,
      targetHandle: targetEdge.targetHandle || targetNodeInputPos,
      label: 'Y',
      type: targetEdge.type || 'orthogonal',
      animated: false,
      markerEnd: targetEdge.markerEnd || {
        type: MarkerType.ArrowClosed,
        color: '#cbd5e1',
      },
      style: targetEdge.style || {
        stroke: '#b8c2cc',
        strokeWidth: 1.4,
      },
    };

    const updatedEdges = edges
      .filter((edge: any) => edge.id !== edgeId)
      .concat([edgeToBranch, edgeFromY]);
    const updatedNodes = [...nodes, newNode];

    setNodes(updatedNodes);
    setEdges(updatedEdges);
    useBuilderHistoryStore
      .getState()
      .push(makeSnapshot(useBuilderStore.getState()));
  };

  const handleToggleInputPosition = (
    nodeId: string,
    position: 'left' | 'top',
  ) => {
    const targetHandleId = position === 'top' ? 'input-top' : 'input-left';

    const updatedNodes = nodes.map((node: any) => {
      if (node.id === nodeId) {
        return {
          ...node,
          data: {
            ...node.data,
            inputPosition: position,
          },
        };
      }
      return node;
    });

    const updatedEdges = edges.map((edge: any) => {
      if (edge.target === nodeId) {
        return {
          ...edge,
          targetHandle: targetHandleId,
          data: {
            ...(edge.data || {}),
            points: undefined,
          },
        };
      }
      return edge;
    });

    setNodes(updatedNodes);
    setEdges(updatedEdges);
    useBuilderHistoryStore
      .getState()
      .push(makeSnapshot(useBuilderStore.getState()));
  };

  const handleToggleOutputPosition = (
    nodeId: string,
    position: 'right' | 'bottom',
  ) => {
    const sourceHandleId =
      position === 'bottom' ? 'output-bottom' : 'output-right';

    const updatedNodes = nodes.map((node: any) => {
      if (node.id === nodeId) {
        return {
          ...node,
          data: {
            ...node.data,
            outputPosition: position,
          },
        };
      }
      return node;
    });

    const updatedEdges = edges.map((edge: any) => {
      if (edge.source === nodeId) {
        if (
          !edge.sourceHandle ||
          edge.sourceHandle === 'output-right' ||
          edge.sourceHandle === 'output-bottom'
        ) {
          return {
            ...edge,
            sourceHandle: sourceHandleId,
            data: {
              ...(edge.data || {}),
              points: undefined,
            },
          };
        }
        return {
          ...edge,
          data: {
            ...(edge.data || {}),
            points: undefined,
          },
        };
      }
      return edge;
    });

    setNodes(updatedNodes);
    setEdges(updatedEdges);
    useBuilderHistoryStore
      .getState()
      .push(makeSnapshot(useBuilderStore.getState()));
  };

  const handleSetIndividualOutputPosition = (
    nodeId: string,
    outputId: string,
    position: 'right' | 'bottom',
  ) => {
    const updatedNodes = nodes.map((node: any) => {
      if (node.id === nodeId) {
        const isSingleOutputNode =
          node.type !== 'branch' &&
          node.type !== 'ynBranch' &&
          node.type !== 'llm' &&
          node.type !== 'fixedmenu';

        return {
          ...node,
          data: {
            ...node.data,
            ...(isSingleOutputNode ? { outputPosition: position } : {}),
            outputPositions: {
              ...(node.data?.outputPositions || {}),
              [outputId]: position,
            },
          },
        };
      }
      return node;
    });

    const updatedEdges = edges.map((edge: any) => {
      if (edge.source === nodeId) {
        if (
          !edge.sourceHandle ||
          edge.sourceHandle === 'output-right' ||
          edge.sourceHandle === 'output-bottom'
        ) {
          const sourceHandleId =
            position === 'bottom' ? 'output-bottom' : 'output-right';
          return {
            ...edge,
            sourceHandle: sourceHandleId,
            data: {
              ...(edge.data || {}),
              points: undefined,
            },
          };
        }

        if (edge.sourceHandle === outputId) {
          return {
            ...edge,
            data: {
              ...(edge.data || {}),
              points: undefined,
            },
          };
        }
      }
      return edge;
    });

    setNodes(updatedNodes);
    setEdges(updatedEdges);
    useBuilderHistoryStore
      .getState()
      .push(makeSnapshot(useBuilderStore.getState()));
  };

  // const { onLayout } = useAutoLayout();

  const handleAutoLayout = useCallback(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = alignScenarioNodes(
      nodes as any,
      edges as any,
    );
    setNodes(layoutedNodes as any);
    setEdges(layoutedEdges as any);
    useBuilderHistoryStore
      .getState()
      .push(makeSnapshot(useBuilderStore.getState()));
  }, [nodes, edges, setNodes, setEdges]);

  const handleNodeDrag = useCallback(
    (_: React.MouseEvent, draggedNode: Node) => {
      const connectedEdges = edges.filter(
        (e: Edge) => e.source === draggedNode.id || e.target === draggedNode.id,
      );
      if (connectedEdges.length === 0) return;

      const getNodeDimensions = (node: any) => {
        if (node.type === 'ynBranch') {
          return { width: 30, height: 30 };
        }
        if (node.type === 'scenario') {
          const isCollapsed = node.data?.isCollapsed !== false;
          return { width: 450, height: isCollapsed ? 50 : 120 };
        }
        const width = node.width || (node as any).measured?.width || 280;
        const height = node.height || (node as any).measured?.height || 160;
        return { width, height };
      };

      const getHandleOffset = (
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

            const handlesOnSide = allHandles.filter(
              (h) => getPos(h) === targetSide,
            );
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

      const SNAP_THRESHOLD = 15;
      let newX = draggedNode.position.x;
      let newY = draggedNode.position.y;
      let snappedX = false;
      let snappedY = false;

      for (const edge of connectedEdges) {
        const isSource = edge.source === draggedNode.id;
        const partnerId = isSource ? edge.target : edge.source;
        const partnerNode = nodes.find((n: Node) => n.id === partnerId);
        if (!partnerNode) continue;

        const myOffset = getHandleOffset(
          draggedNode,
          isSource,
          isSource
            ? (edge.sourceHandle ?? undefined)
            : (edge.targetHandle ?? undefined),
        );
        const partnerOffset = getHandleOffset(
          partnerNode,
          !isSource,
          !isSource
            ? (edge.sourceHandle ?? undefined)
            : (edge.targetHandle ?? undefined),
        );

        const myHandleX = newX + myOffset.offsetX;
        const myHandleY = newY + myOffset.offsetY;

        const partnerHandleX = partnerNode.position.x + partnerOffset.offsetX;
        const partnerHandleY = partnerNode.position.y + partnerOffset.offsetY;

        // 1) 수평 직선 마그넷 스냅 (Horizontal Alignment)
        if (
          !snappedY &&
          Math.abs(myHandleY - partnerHandleY) <= SNAP_THRESHOLD
        ) {
          newY = partnerHandleY - myOffset.offsetY;
          snappedY = true;
        }

        // 2) 수직 직선 마그넷 스냅 (Vertical Alignment)
        if (
          !snappedX &&
          Math.abs(myHandleX - partnerHandleX) <= SNAP_THRESHOLD
        ) {
          newX = partnerHandleX - myOffset.offsetX;
          snappedX = true;
        } else if (
          !snappedX &&
          !isSource &&
          newY > partnerNode.position.y + 20
        ) {
          const partnerWidth =
            partnerNode.width || (partnerNode as any).measured?.width || 280;
          const myWidth =
            draggedNode.width || (draggedNode as any).measured?.width || 280;
          const partnerBottomX = partnerNode.position.x + partnerWidth / 2;
          const myTopX = newX + myWidth / 2;
          if (Math.abs(myTopX - partnerBottomX) <= 60) {
            newX = partnerBottomX - myWidth / 2;
            snappedX = true;
          }
        }

        if (snappedX && snappedY) break;
      }

      if (snappedX || snappedY) {
        draggedNode.position = { x: newX, y: newY };
        setNodes(
          nodes.map((n: Node) =>
            n.id === draggedNode.id
              ? { ...n, position: { x: newX, y: newY } }
              : n,
          ),
        );
      }
    },
    [edges, nodes, setNodes],
  );

  const handleNodeDragStop = useCallback(
    (_: React.MouseEvent, draggedNode: Node) => {
      const connectedEdges = edges.filter(
        (e: Edge) => e.source === draggedNode.id || e.target === draggedNode.id,
      );
      if (connectedEdges.length === 0) return;

      const getNodeWidth = (node: any) => {
        if (node.type === 'ynBranch') return 30;
        if (node.type === 'scenario') return 450;
        return node.width || (node as any).measured?.width || 280;
      };

      const getSourceHandleOffsetX = (
        sourceNode: any,
        handleId?: string,
        forceBottom = false,
      ) => {
        const width = getNodeWidth(sourceNode);
        if (sourceNode.type === 'ynBranch') {
          const hId = handleId === 'N' ? 'N' : 'Y';
          const posY = forceBottom
            ? 'bottom'
            : sourceNode.data?.outputPositions?.['Y'] || 'right';
          const posN = forceBottom
            ? 'bottom'
            : sourceNode.data?.outputPositions?.['N'] || 'bottom';
          const targetSide = hId === 'Y' ? posY : posN;
          const sameSideHandles = ['Y', 'N'].filter(
            (id) => (id === 'Y' ? posY : posN) === targetSide,
          );
          const indexOnSide = sameSideHandles.indexOf(hId);
          const countOnSide = sameSideHandles.length || 1;
          const ratio = (indexOnSide + 1) / (countOnSide + 1);
          return targetSide === 'bottom' ? width * ratio : width;
        }

        if (sourceNode.type === 'api') {
          const hId = handleId === 'onError' ? 'onError' : 'onSuccess';
          const posSuccess = forceBottom
            ? 'bottom'
            : sourceNode.data?.outputPositions?.['onSuccess'] || 'right';
          const posError = forceBottom
            ? 'bottom'
            : sourceNode.data?.outputPositions?.['onError'] || 'bottom';
          const targetSide = hId === 'onError' ? posError : posSuccess;
          const sameSideHandles = ['onSuccess', 'onError'].filter(
            (id) => (id === 'onError' ? posError : posSuccess) === targetSide,
          );
          const indexOnSide = sameSideHandles.indexOf(hId);
          const countOnSide = sameSideHandles.length || 1;
          const ratio = (indexOnSide + 1) / (countOnSide + 1);
          return targetSide === 'bottom' ? width * ratio : width;
        }

        const getPos = (hId: string) =>
          forceBottom
            ? 'bottom'
            : sourceNode.data?.outputPositions?.[hId] ||
              sourceNode.data?.outputPosition ||
              'right';

        const targetSide = getPos(handleId || 'default');
        return targetSide === 'bottom' ? width / 2 : width;
      };

      const nodeUpdates: Record<string, any> = {};
      const edgeUpdates: Record<string, any> = {};
      const updatedNodePositions: Record<string, { x: number; y: number }> = {};
      const VERTICAL_CONVERT_THRESHOLD = 70;

      for (const edge of connectedEdges) {
        let prevNode: any = null;
        let nextNode: any = null;

        if (edge.target === draggedNode.id) {
          prevNode = nodes.find((n: any) => n.id === edge.source);
          nextNode = draggedNode;
        } else if (edge.source === draggedNode.id) {
          prevNode = draggedNode;
          nextNode = nodes.find((n: any) => n.id === edge.target);
        }

        if (!prevNode || !nextNode) continue;

        if (nextNode.position.y > prevNode.position.y + 20) {
          const nextWidth = getNodeWidth(nextNode);
          const prevBottomX =
            prevNode.position.x +
            getSourceHandleOffsetX(
              prevNode,
              edge.sourceHandle ?? undefined,
              true,
            );
          const nextTopX = nextNode.position.x + nextWidth / 2;

          if (Math.abs(nextTopX - prevBottomX) <= VERTICAL_CONVERT_THRESHOLD) {
            const snappedX = Math.round(prevBottomX - nextWidth / 2);
            updatedNodePositions[nextNode.id] = {
              x: snappedX,
              y: nextNode.position.y,
            };

            const outputId = edge.sourceHandle || 'default';
            const isSingleOutputPrev =
              prevNode.type !== 'branch' &&
              prevNode.type !== 'ynBranch' &&
              prevNode.type !== 'llm' &&
              prevNode.type !== 'fixedmenu' &&
              prevNode.type !== 'api';

            nodeUpdates[prevNode.id] = {
              ...(nodeUpdates[prevNode.id] || {}),
              ...(isSingleOutputPrev ? { outputPosition: 'bottom' } : {}),
              outputPositions: {
                ...(prevNode.data?.outputPositions || {}),
                ...(nodeUpdates[prevNode.id]?.outputPositions || {}),
                [outputId]: 'bottom',
              },
            };

            nodeUpdates[nextNode.id] = {
              ...(nodeUpdates[nextNode.id] || {}),
              inputPosition: 'top',
            };

            const sourceHandleId = isSingleOutputPrev
              ? 'output-bottom'
              : edge.sourceHandle;

            edgeUpdates[edge.id] = {
              sourceHandle: sourceHandleId,
              targetHandle: 'input-top',
              points: undefined,
            };
          }
        }
      }

      if (
        Object.keys(nodeUpdates).length > 0 ||
        Object.keys(edgeUpdates).length > 0 ||
        Object.keys(updatedNodePositions).length > 0
      ) {
        const nextNodes = nodes.map((n: any) => {
          let updated = n;
          if (updatedNodePositions[n.id]) {
            updated = { ...updated, position: updatedNodePositions[n.id] };
          }
          if (nodeUpdates[n.id]) {
            updated = {
              ...updated,
              data: {
                ...updated.data,
                ...nodeUpdates[n.id],
              },
            };
          }
          return updated;
        });

        const nextEdges = edges.map((e: any) => {
          if (edgeUpdates[e.id]) {
            return {
              ...e,
              ...edgeUpdates[e.id],
              data: {
                ...(e.data || {}),
                points: undefined,
              },
            };
          }
          return e;
        });

        setNodes(nextNodes);
        setEdges(nextEdges);
        useBuilderHistoryStore
          .getState()
          .push(makeSnapshot(useBuilderStore.getState()));
      }
    },
    [edges, nodes, setNodes, setEdges],
  );

  const getSelectedNodeIds = useCallback(() => {
    return nodes
      .filter((node: any) => node.selected)
      .map((node: any) => node.id);
  }, [nodes]);

  const isSelectionLayerTarget = useCallback((target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) return false;

    const pane = target.closest('.react-flow__pane');
    const isSelectionPane = pane?.classList.contains('selection') ?? false;

    return Boolean(
      isSelectionPane ||
      target.closest('.react-flow__nodesselection') ||
      target.closest('.react-flow__nodesselection-rect') ||
      target.closest('.react-flow__selection'),
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

  const handlePaneContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();

    const clearedEdges: Edge<any>[] = edges.map((edge: any) => ({
      ...edge,
      selected: false,
    }));

    const { x, y } = getSafeMenuPosition(event.clientX, event.clientY, 'pane');
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
      target: { type: 'pane' },
    });
  };

  const handleNodeContextMenu = (event: React.MouseEvent, node: Node<any>) => {
    event.preventDefault();
    event.stopPropagation();

    const clearedEdges: Edge<any>[] = edges.map((edge: any) => ({
      ...edge,
      selected: false,
    }));

    const { x, y } = getSafeMenuPosition(event.clientX, event.clientY, 'node');
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
      target: { type: 'node', id: node.id },
    });
  };

  const handleEdgeContextMenu = (event: React.MouseEvent, edge: Edge<any>) => {
    event.preventDefault();
    event.stopPropagation();

    const nextEdges: Edge<any>[] = edges.map((item: any) => ({
      ...item,
      selected: item.id === edge.id,
    }));

    const { x, y } = getSafeMenuPosition(event.clientX, event.clientY, 'edge');
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
      target: { type: 'edge', id: edge.id },
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

      const { x, y } = getSafeMenuPosition(
        event.clientX,
        event.clientY,
        'node',
      );
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
          type: 'selection',
          ids: selectedIds,
        },
      });
    },
    [getSelectedNodeIds, isSelectionLayerTarget, project],
  );
  // ===========================================================

  // ===========================================================
  // 클립보드
  const pushHistory = useCallback(() => {
    useBuilderHistoryStore
      .getState()
      .push(makeSnapshot(useBuilderStore.getState()));
  }, []);

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

  // 노드 우클릭 메뉴 액션
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
      });

      closeContextMenu();
    },
    [edges, nodes, pasteClipboard, pushHistory, setEdges, setNodes],
  );
  // ===========================================================

  // nodes가 undefined이거나 position 없는 항목을 보정
  const safeNodes = useMemo(() => {
    const list = Array.isArray(nodes) ? nodes : [];
    return list;
    // return list.filter(Boolean).map((n: any) => {
    //   // 기본 position 보정
    //   const px = n?.position?.x ?? n?.positionAbsolute?.x ?? 0;
    //   const py = n?.position?.y ?? n?.positionAbsolute?.y ?? 0;
    //   return { ...n, position: { x: px, y: py } };
    // });
  }, [nodes]);

  // 그룹(시나리오) 접힘 처리도 safeNodes 기준으로
  const visibleNodes = useMemo(() => {
    const collapsedGroupIds = new Set(
      safeNodes
        .filter(
          (n: any) =>
            (n.type === 'scenario' || n.type === 'selectionGroup') &&
            n?.data?.isCollapsed,
        )
        .map((n: any) => n.id),
    );
    return safeNodes.filter(
      (n: any) => !n.parentNode,
      // (n: any) => !n.parentNode || !collapsedGroupIds.has(n.parentNode),
    );
  }, [safeNodes]);

  const handleNodeClick = async (event: any, node: any) => {
    // 노드 클릭 시 shift 키로 다중 노드 선택 가능 하도록 수정
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
      const userInfo = await loadingUserData();
      if (userInfo.unuseNodes?.includes(node.type)) {
        showAlert(
          `${t('The node does not have modification privileges')}`,
        );
        return;
      }
      setSelectedNodes((prev: any) => {
        const exists = prev.some((item: any) => item.id === node.id);
        if (exists) return prev;
        return [node];
      });
      setSelectedNodeId(node.id);
    }
  };

  const handlePaneClick = () => {
    setSelectedNodes([]);
    setSelectedNodeId(null);

    // 마우스 우 클릭 이벤트
    closeContextMenu();
  };

  const handleSelectionChange = useCallback(
    ({ nodes }: { nodes: Node<any>[] }) => {
      setSelectedNodes(nodes);
      if (nodes.length === 1) {
        setSelectedNodeId(nodes[0].id);
      } else {
        setSelectedNodeId(null);
      }
    },
    [setSelectedNodeId],
  );

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
      if (!reactFlowBounds) return;

      const type = event.dataTransfer.getData('application/reactflow');

      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      // 드롭 위치를 저장한 후 시나리오 선택 모달을 연다.
      if (type === 'scenarioGroup') {
        setScenarioGroupDropPosition(position);
        setIsGroupModalOpen(true);
        return;
      }

      addNode(type, position);
    },
    [project, addNode],
  );

  // ========================================================================================================
  // 키보드 단축키 (Undo/Redo)
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
  // ========================================================================================================

  // 그룹노드 핸들 함수
  const handleGroupSelectedNodes = () => {
    console.log('[DEBUG G Button Clicked]', {
      selectedNodes,
      nodesSelectedFilter: nodes.filter((node: any) => node.selected),
      edges,
    });
    const activeSelectedNodes =
      selectedNodes.length >= 2
        ? selectedNodes
        : nodes.filter((node: any) => node.selected);

    console.log('[DEBUG activeSelectedNodes]', activeSelectedNodes);

    if (activeSelectedNodes.length < 2) {
      showAlert(
        `${t('To group, you must select at least 2 top-level nodes.')}`,
      );
      return;
    }

    const selectedIds = new Set(activeSelectedNodes.map((n: any) => n.id));
    const syncedNodes = nodes.map((node: any) => ({
      ...node,
      selected: selectedIds.has(node.id),
    }));

    useBuilderStore.setState({ nodes: syncedNodes });

    const groupLabel = `${t('Selected Group')}`;
    groupSelectedNodes(groupLabel);
  };
  // ========================================================================================================

  // ========================================================================================================
  // 노드 검색 기능
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
    [nodes, setNodes, setSelectedNodeId, setCenter],
  );
  // ========================================================================================================

  // ========================================================================================================
  // 노드 검색 패널 높이에 따라 캔버스 패널 높이 조정
  const updateCanvasPanelHeight = useCallback(() => {
    if (!searchPanelRef.current) return;
    setCanvasPanelHeight(searchPanelRef.current.offsetHeight);
  }, []);
  useLayoutEffect(() => {
    updateCanvasPanelHeight();
  }, [
    updateCanvasPanelHeight,
    isCanvasPanelCollapsed,
    filteredSearchResults.length,
  ]);

  useEffect(() => {
    window.addEventListener('resize', updateCanvasPanelHeight);
    return () => window.removeEventListener('resize', updateCanvasPanelHeight);
  }, [updateCanvasPanelHeight]);
  // ========================================================================================================

  // ========================================================================================================
  // add node 모달 팝업
  const [insertTarget, setInsertTarget] = useState<InsertTarget | null>(null);
  const [activitySearch, setActivitySearch] = useState('');
  const [activityInsertPosition, setActivityInsertPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [recentTypes, setRecentTypes] = useState<ActivityType[]>([
    'message',
    'setSlot',
    'branch',
    'form',
  ]);

  const closeActivityPicker = () => {
    setInsertTarget(null);
    setActivitySearch('');
    setActivityInsertPosition(null);
  };

  const openActivityPicker = useCallback(
    async (target: InsertTarget) => {
      setInsertTarget(target);
      setActivitySearch('');
    },
    [setInsertTarget, setActivitySearch],
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
      // unuseNodes.includes(type) ||
      type === 'branch' &&
      insertTarget.targetId
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
    // 일반 캔버스에 추가하는 경우 (Flow 뷰 시각적 구분감 향상을 위한 X/Y 축 정밀 배치)
    const VERTICAL_SPACING = 180;
    const HORIZONTAL_STEP = 160;
    let xOffset = 0;

    if (insertTarget.sourceHandle) {
      if (insertTarget.sourceHandle === 'onError') {
        xOffset = HORIZONTAL_STEP;
      } else if (insertTarget.sourceHandle === 'onSuccess') {
        xOffset = 0;
      } else if (
        insertTarget.sourceHandle.includes('condition') ||
        insertTarget.sourceHandle.includes('reply')
      ) {
        const match = insertTarget.sourceHandle.match(/\d+/);
        const handleIdx = match ? parseInt(match[0], 10) : 1;
        xOffset = (handleIdx > 0 ? handleIdx : 1) * 140;
      } else if (insertTarget.sourceHandle !== 'default') {
        xOffset = 80;
      }
    }

    const shiftYThreshold = sourceNode
      ? sourceNode.position.y + 50
      : targetNode
        ? targetNode.position.y - 10
        : -1;

    let targetX = 100;
    if (sourceNode && targetNode) {
      targetX =
        Math.round((sourceNode.position.x + targetNode.position.x) / 2) +
        xOffset;
    } else if (sourceNode) {
      targetX = sourceNode.position.x + xOffset;
    } else if (targetNode) {
      targetX = targetNode.position.x + xOffset;
    } else if (activityInsertPosition) {
      targetX = activityInsertPosition.x;
    }

    const targetY = sourceNode
      ? sourceNode.position.y + VERTICAL_SPACING
      : targetNode
        ? Math.max(40, targetNode.position.y)
        : (activityInsertPosition?.y ?? 100);

    const shiftedNodes = nodes.map((node: any) => {
      if (node.parentNode || shiftYThreshold < 0) return node;
      if (node.position.y >= shiftYThreshold && node.id !== sourceNode?.id) {
        return {
          ...node,
          position: {
            ...node.position,
            y: node.position.y + VERTICAL_SPACING,
          },
        };
      }
      return node;
    });

    const insertedNodeNextSourceHandle = type === 'api' ? 'onSuccess' : null;

    if (parentNode) {
      const groupChildren = nodes
        .filter((node: any) => node.parentNode === parentNode.id)
        .slice()
        .sort((a: any, b: any) => (a.position?.y || 0) - (b.position?.y || 0));

      const groupNewNode: BuilderNode = {
        id: data.id || `${type}-${Date.now()}`,
        type,
        position: {
          x: 28,
          y: 88 + groupChildren.length * 120,
        },
        parentNode: parentNode.id,
        extent: 'parent',
        data: {
          ...data,
          flowCollapsed: false,
        },
      };

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
              target: groupNewNode.id,
              sourceHandle,
            }),
            ...(nextChild
              ? [
                  createWorkflowEdge({
                    source: groupNewNode.id,
                    target: nextChild.id,
                    sourceHandle: insertedNodeNextSourceHandle,
                  }),
                ]
              : []),
          ]
        : edges;

      setNodes([...nodes, groupNewNode]);
      setEdges(nextEdges);
      setSelectedNodeId(groupNewNode.id);
      setRecentTypes((prev) =>
        [type, ...prev.filter((item) => item !== type)].slice(0, 6),
      );
      closeActivityPicker();
      return;
    }

    const newNode: BuilderNode = {
      id: data.id || `${type}-${Date.now()}`,
      type,
      position: { x: targetX, y: targetY },
      parentNode: undefined,
      extent: undefined,
      data: {
        ...data,
        flowCollapsed: false,
      },
    };

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

    setNodes([...shiftedNodes, newNode]);
    setEdges(nextEdges);
    setSelectedNodeId(newNode.id);
    setRecentTypes((prev) =>
      [type, ...prev.filter((item) => item !== type)].slice(0, 6),
    );
    closeActivityPicker();
  };
  // ========================================================================================================

  function goList() {
    router.back();
  }

  // version 관리
  const [selectedVersion, setSelectedVersion] = useState<Scenario | null>(
    scenario ?? null,
  );

  const getVersionNumber = (version?: string) =>
    Number(String(version ?? '').replace(/[^0-9]/g, '')) || 0;

  const selectedScenarioVersions = (scenarios ?? [])
    .filter((item: any) => item.groupId && item.groupId === scenario?.groupId)
    .sort(
      (a: any, b: any) =>
        getVersionNumber(a.versions) - getVersionNumber(b.versions),
    );
  // 상세보기 version 이동
  const handleSelectedVersion = async (data?: Scenario) => {
    if (!data?.id) return;

    const res = await fetchScenario(data.id);
    setNodes(res.nodes ?? []);
    setEdges(res.edges ?? []);
    setSelectedVersion(res);
  };

  return (
    <Box
      flex={1}
      sx={{ minHeight: 0 }}
      height={'100%'}
      display={'flex'}
      flexDirection={'column'}
      gap={1.5}
    >
      <Box
        border={1}
        flexGrow={1}
        height={0}
        minHeight={0}
        borderRadius={2}
        borderColor={COLORS.blueGrey[100]}
        display={'flex'}
        overflow={'hidden'}
      >
        <ScenarioGroupModal
          isOpen={isGroupModalOpen}
          scenarios={scenarios}
          // onClose={() => setIsGroupModalOpen(false)}
          // onSelect={(selected: any) => {
          //   addScenarioAsGroup(selected);
          //   setIsGroupModalOpen(false);
          // }}
          onClose={() => {
            setIsGroupModalOpen(false);
            setScenarioGroupDropPosition(null);
          }}
          onSelect={(selected: any) => {
            addScenarioAsGroup(
              selected,
              scenarioGroupDropPosition ?? undefined,
            );

            setIsGroupModalOpen(false);
            setScenarioGroupDropPosition(null);
          }}
        />

        {/* 좌측 메뉴바 설정 모달팝업 */}
        <ScenarioNodesSettingModal
          isOpen={isNodesSettingModalOpen}
          onClose={() => setIsNodesSettingModalOpen(false)}
        />

        {/* 좌측 메뉴바 영역 */}
        <NodesTreeUI
          props={nodeTreeUIOptions}
          onScenarioGroupClick={() => setIsGroupModalOpen(true)}
          onNodesSettingClick={() => setIsNodesSettingModalOpen(true)}
        />

        {/* 우측 react flow 영역 */}
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
            <div
              onClick={() => {
                saveScenario(backend, scenario);
              }}
              onKeyDown={(e) =>
                handleInteractiveKeydown(e, () =>
                  saveScenario(backend, scenario),
                )
              }
              role="button"
              tabIndex={0}
            >
              <img
                src="/images/save.png"
                alt="Save Icon"
                className={styles.saveButton}
              />
            </div>
            <div
              onClick={() => {
                // 시뮬레이터 열 때 캔버스 패널은 자동으로 숨겨지도록 설정
                setIsCanvasPanelCollapsed(!isSimulatorVisible);
                // current values 패널은 시뮬레이터와 함께 보이도록 설정
                setIsSlotDisplayVisible(!isSimulatorVisible);
                // 시뮬레이터 토글
                setIsSimulatorVisible(!isSimulatorVisible);
              }}
              onKeyDown={(e) =>
                handleInteractiveKeydown(e, () =>
                  setIsSimulatorVisible(!isSimulatorVisible),
                )
              }
              role="button"
              tabIndex={0}
            >
              <img
                src="/images/chat_simulator.png"
                alt="Simulator Icon"
                className={
                  !isSimulatorVisible
                    ? styles.botButtonHidden
                    : styles.botButton
                }
              />
            </div>
          */}
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flexGrow: 1,
              height: '100%',
              width: '100%',
              minHeight: 0,
            }}
          >
            {tabs.length > 0 && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  borderBottom: `1px solid ${COLORS.blueGrey[100]}`,
                  backgroundColor: '#F8FAFC',
                  padding: '4px 8px 0 8px',
                  zIndex: 4,
                  position: 'relative',
                }}
              >
                {tabs.map((tab) => {
                  const isActive = tab.id === activeTabId;
                  return (
                    <Box
                      key={tab.id}
                      onClick={() => handleTabSwitch(tab.id)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        padding: '6px 12px',
                        borderRadius: '8px 8px 0 0',
                        border: '1px solid',
                        borderColor: isActive
                          ? COLORS.blueGrey[100]
                          : 'transparent',
                        borderBottom: isActive ? '1px solid #ffffff' : 'none',
                        backgroundColor: isActive ? '#ffffff' : 'transparent',
                        color: isActive ? 'primary.main' : 'text.secondary',
                        fontWeight: isActive ? 700 : 500,
                        fontSize: '13px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        marginBottom: '-1px',
                        '&:hover': {
                          backgroundColor: isActive ? '#ffffff' : '#F1F5F9',
                          color: isActive ? 'primary.main' : 'text.primary',
                        },
                      }}
                    >
                      <span>{tab.name}</span>
                      {tabs.length > 1 && (
                        <IconButton
                          size="small"
                          onClick={(e) => handleTabClose(tab.id, e)}
                          sx={{
                            padding: 0.2,
                            color: isActive ? 'primary.main' : 'text.secondary',
                            opacity: 0.7,
                            '&:hover': {
                              opacity: 1,
                              backgroundColor: 'rgba(0, 0, 0, 0.05)',
                            },
                          }}
                        >
                          <CloseIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      )}
                    </Box>
                  );
                })}
              </Box>
            )}
            <div
              style={{
                flexGrow: 1,
                minHeight: 0,
                position: 'relative',
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Top Toolbar Overlay - Visible in both Flow and Orkes modes */}
              <div
                style={{
                  position: 'absolute',
                  top: 12,
                  left: 12,
                  zIndex: 10,
                  pointerEvents: 'none',
                }}
              >
                <div
                  ref={searchPanelRef}
                  style={{ pointerEvents: 'auto' }}
                  className={`${styles.searchPanel} ${
                    isCanvasPanelCollapsed ? styles.searchPanelCollapsed : ''
                  }`}
                >
                  <div className={styles.searchTopRow}>
                    <div className={styles.toolRow}>
                      <button
                        type="button"
                        onClick={undo}
                        title={`${t('Undo')} (Ctrl/Cmd+Z)`}
                        className={styles.toolButton}
                        disabled={!canUndo}
                      >
                        <Undo size={18} />
                      </button>

                      <button
                        type="button"
                        onClick={redo}
                        title={`${t('Redo')} (Ctrl+Y, Cmd+Shift+Z)`}
                        className={styles.toolButton}
                        disabled={!canRedo}
                      >
                        <Redo size={18} />
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          const confirmed = await showConfirm(
                            `${t('Do you want to save the Scenario?')}`,
                          );
                          if (!confirmed) return;
                          const payload = {
                            ...scenario,
                            version_yn: false,
                          };
                          resetExecution();
                          await saveScenario(payload);
                        }}
                        title={`${t('Commit')} & ${t('Save Scenario')}`}
                        className={styles.toolButton}
                      >
                        <Save size={18} />
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          const confirmed = await showConfirm(
                            `${t('Do you want to push the Scenario?')}`,
                          );
                          if (!confirmed) return;
                          const payload = {
                            ...scenario,
                            version_yn: true,
                          };
                          resetExecution();
                          await saveScenario(payload);
                        }}
                        title={t('Push Scenario')}
                        className={styles.toolButton}
                      >
                        <SendIcon size={18} />
                      </button>

                      <button
                        type="button"
                        onClick={goList}
                        title={t('Back to Scenario List')}
                        className={styles.toolButton}
                      >
                        <ArrowLeft size={18} />
                      </button>

                      <div
                        style={{
                          margin: '0 4px',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        |
                      </div>

                      <button
                        type="button"
                        onClick={() => setToolMode('pan')}
                        title={t('Pan mode')}
                        className={`${styles.toolButton} ${isPanMode ? styles.toolButtonActive : ''}`}
                      >
                        <Hand size={18} />
                      </button>

                      <button
                        type="button"
                        onClick={() => setToolMode('select')}
                        title={t('Select mode')}
                        className={`${styles.toolButton} ${isSelectMode ? styles.toolButtonActive : ''}`}
                      >
                        <MousePointer2 size={18} />
                      </button>

                      <button
                        type="button"
                        title={t('canvas add Memo')}
                        onClick={addCanvasMemo}
                        className={styles.toolButton}
                      >
                        <StickyNote size={18} />
                      </button>

                      <button
                        type="button"
                        title={t('Show chatbot simulator')}
                        onClick={() => {
                          setIsSlotDisplayVisible(!isSimulatorVisible);
                          setIsSimulatorVisible(!isSimulatorVisible);
                        }}
                        className={`${styles.toolButton} ${isSimulatorVisible ? styles.toolButtonActive : ''}`}
                      >
                        <Sparkles size={18} />
                      </button>

                      <button
                        type="button"
                        title={`${t('log preview')} (${t('DB JSON Edit')})`}
                        onClick={() => setIsLogVisible(true)}
                        className={`${styles.toolButton} ${isMemoVisible ? styles.toolButtonActive : ''}`}
                      >
                        <Activity size={18} />
                      </button>

                      <div
                        style={{
                          margin: '0 4px',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        |
                      </div>

                      <button
                        type="button"
                        title={t('Run from Start to Anchor')}
                        onClick={() => {
                          setIsSlotDisplayVisible(true);
                          runBetweenStartAndAnchor();
                        }}
                        className={`${styles.toolButton} ${executionRunning ? styles.toolButtonActive : ''}`}
                        disabled={executionRunning}
                      >
                        <Play size={18} />
                      </button>

                      <button
                        type="button"
                        title={t('Stop execution')}
                        onClick={() => stopExecution()}
                        className={styles.toolButton}
                        disabled={!executionRunning}
                      >
                        <Square size={18} />
                      </button>

                      <button
                        type="button"
                        title={t('Execution log')}
                        onClick={() => setIsExecutionLogVisible(true)}
                        className={styles.toolButton}
                      >
                        <FileText size={18} />
                      </button>

                      <div
                        style={{
                          margin: '0 4px',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        |
                      </div>

                      <button
                        type="button"
                        title={t('Group Selected Nodes')}
                        onClick={handleGroupSelectedNodes}
                        className={styles.toolButton}
                      >
                        <b>{t('G')}</b>
                      </button>

                      <div
                        style={{
                          margin: '0 4px',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        |
                      </div>

                      {/* Segmented Switch Control for View Mode (Far Right of Toolbar) */}
                      <Box
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          backgroundColor: '#f1f5f9',
                          borderRadius: '8px',
                          padding: '2px',
                          border: '1px solid #cbd5e1',
                          ml: 0.5,
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => handleViewModeChange('flow')}
                          style={{
                            padding: '4px 12px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: viewMode === 'flow' ? 700 : 500,
                            color: viewMode === 'flow' ? '#0f172a' : '#64748b',
                            backgroundColor:
                              viewMode === 'flow' ? '#ffffff' : 'transparent',
                            boxShadow:
                              viewMode === 'flow'
                                ? '0 1px 3px rgba(0,0,0,0.12)'
                                : 'none',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          Flow
                        </button>
                        <button
                          type="button"
                          onClick={() => handleViewModeChange('orkes')}
                          style={{
                            padding: '4px 12px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: viewMode === 'orkes' ? 700 : 500,
                            color: viewMode === 'orkes' ? '#0f172a' : '#64748b',
                            backgroundColor:
                              viewMode === 'orkes' ? '#ffffff' : 'transparent',
                            boxShadow:
                              viewMode === 'orkes'
                                ? '0 1px 3px rgba(0,0,0,0.12)'
                                : 'none',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          Orkes
                        </button>
                      </Box>
                    </div>

                    <div className={styles.searchRow}>
                      <FormControl size="small">
                        <Select
                          value={searchType}
                          onChange={(e) => setSearchType(e.target.value)}
                          className={styles.searchSelect} // 기존 스타일 유지
                          sx={{
                            height: '40px',
                            backgroundColor: '#fff',
                            fontSize: '12px',
                            '& .MuiSelect-select': {
                              paddingTop: '0px',
                              paddingBottom: '0px',
                              display: 'flex',
                              alignItems: 'center',
                            },
                          }}
                          // MenuProps를 통해 렌더링 위치를 강제로 body에 고정
                          MenuProps={{
                            disablePortal: false,
                          }}
                        >
                          <MenuItem value="all" sx={{ fontSize: '12px' }}>
                            {t('All')}
                          </MenuItem>
                          {MOCK_UP_TREE_DATA[0].children.map(
                            (item: TreeItem) => (
                              <MenuItem
                                key={item.id}
                                value={item.id}
                                sx={{ fontSize: '12px' }}
                              >
                                {item.id}
                              </MenuItem>
                            ),
                          )}
                        </Select>
                      </FormControl>

                      <input
                        className={styles.searchInput}
                        type="text"
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                        placeholder={t('Search node message text')}
                        style={{ minWidth: '250px' }}
                      />
                    </div>

                    <button
                      type="button"
                      title={
                        isCanvasPanelCollapsed
                          ? `${t('Show canvas panel')}`
                          : `${t('Hide canvas panel')}`
                      }
                      onClick={() => setIsCanvasPanelCollapsed((prev) => !prev)}
                      className={`${styles.toolButton} ${styles.panelToggleButton}`}
                    >
                      {isCanvasPanelCollapsed ? (
                        <ChevronRight size={18} />
                      ) : (
                        <ChevronLeft size={18} />
                      )}
                    </button>
                  </div>

                  {!isCanvasPanelCollapsed &&
                    filteredSearchResults.length > 0 && (
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
                                {nodeLabels[node.type]?.replace('+ ', '') ||
                                  node.type}
                              </div>
                              <div className={styles.searchResultId}>
                                {node.id}
                              </div>
                            </div>

                            <div className={styles.searchResultText}>
                              {getNodeSearchText(node)
                                .filter(Boolean)
                                .join(' ') || '(empty)'}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                </div>
              </div>

              {viewMode === 'flow' ? (
                <ReactFlow
                  className={isPanMode ? styles.panCanvas : styles.selectCanvas}
                  key={scenario?.id}
                  nodes={visibleNodes}
                  edges={formattedEdges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onConnect={onConnect}
                  onNodeDrag={handleNodeDrag}
                  onNodeDragStop={handleNodeDragStop}
                  nodeTypes={nodeTypes}
                  edgeTypes={edgeTypes}
                  onNodeClick={handleNodeClick}
                  onKeyDown={handleKeyDown}
                  onDragOver={onDragOver}
                  onDrop={onDrop}
                  fitView
                  style={{ backgroundColor: '#ffffff' }}
                  fitViewOptions={{ padding: 0.2, maxZoom: 1.2 }}
                  onMove={(_, vp) => setViewport(vp)}
                  defaultViewport={{ x: 100, y: 100, zoom: 0.5 }}
                  zoomOnScroll
                  zoomOnPinch
                  zoomOnDoubleClick={false}
                  minZoom={0.02}
                  maxZoom={10}
                  panOnDrag={isPanMode}
                  selectionOnDrag={isSelectMode}
                  selectionMode={SelectionMode.Partial}
                  multiSelectionKeyCode="Shift"
                  nodesDraggable={!isSimulatorVisible}
                  deleteKeyCode="Delete"
                  defaultEdgeOptions={{
                    type: 'default',
                    animated: false,
                    markerEnd: {
                      type: MarkerType.ArrowClosed,
                      color: '#cbd5e1',
                    },
                    style: {
                      stroke: '#b8c2cc',
                      strokeWidth: 1.4,
                      strokeDasharray: '0',
                    },
                  }}
                  connectionLineStyle={{
                    stroke: '',
                    strokeWidth: 1.4,
                    strokeDasharray: '0',
                    animation: 'none',
                  }}
                  onPaneContextMenu={handlePaneContextMenu}
                  onNodeContextMenu={handleNodeContextMenu}
                  onEdgeContextMenu={handleEdgeContextMenu}
                  onPaneClick={handlePaneClick}
                  onSelectionChange={handleSelectionChange}
                >
                  <Controls>
                    <ControlButton
                      onClick={handleAutoLayout}
                      title={t('Align Nodes')}
                    >
                      <LayoutGrid size={16} />
                    </ControlButton>
                  </Controls>
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
                </ReactFlow>
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <FlowCanvas
                    nodes={nodes}
                    edges={edges}
                    selectedNodeId={selectedNodeId}
                    onSelectNode={(id) => setSelectedNodeId(id)}
                    onOpenInsert={openActivityPicker}
                    addCanvasMemo={addCanvasMemo}
                    saveScenario={saveScenario}
                  />
                </div>
              )}
            </div>
          </div>

          {/* 캔버스 마우스 우클릭 메뉴 */}
          {contextMenu.open && contextMenu.target?.type === 'pane' && (
            <div
              className={styles.layerMenu}
              style={{ left: contextMenu.x, top: contextMenu.y }}
            >
              <button
                type="button"
                className={`${styles.layerMenuItem}`}
                onClick={() => {
                  const position = contextMenu.flowPosition ?? {
                    x: 100,
                    y: 100,
                  };

                  setActivityInsertPosition(position);
                  closeContextMenu();
                  void openActivityPicker({});
                }}
              >
                <Plus size={16} className={styles.layerMenuIcon} />
                <span>{t('Add Node')}</span>
              </button>

              <div className={styles.layerMenuDivider} />

              <button
                type="button"
                className={`${styles.layerMenuItem} ${!clipboard ? styles.layerMenuItemDisabled : ''}`}
                onClick={() =>
                  handleContextPaste(contextMenu.flowPosition ?? null)
                }
                disabled={!clipboard}
              >
                <Clipboard size={16} className={styles.layerMenuIcon} />
                <span>{t('Paste')}</span>
              </button>

              <div className={styles.layerMenuDivider} />

              <button
                type="button"
                className={styles.layerMenuItem}
                onClick={() => setIsMemoVisible((prev) => !prev)}
              >
                <NotebookPen size={16} className={styles.layerMenuIcon} />
                {t('memo panel')}
              </button>
              <button
                type="button"
                className={styles.layerMenuItem}
                onClick={() => setIsSlotDisplayVisible((prev) => !prev)}
              >
                <Database size={16} className={styles.layerMenuIcon} />
                {t('Runtime State')}
              </button>

              <div className={styles.layerMenuDivider} />

              <button
                type="button"
                className={styles.layerMenuItem}
                onClick={() => {
                  setContextMenu({ open: false, x: 0, y: 0, target: 'pane' });
                  setToolMode('pan');
                }}
              >
                <Hand size={16} className={styles.layerMenuIcon} />
                <span>{t('Pan Mode')}</span>
              </button>
              <button
                type="button"
                className={styles.layerMenuItem}
                onClick={() => {
                  setContextMenu({ open: false, x: 0, y: 0, target: 'pane' });
                  setToolMode('select');
                }}
              >
                <MousePointer2 size={16} className={styles.layerMenuIcon} />
                <span>{t('Select Mode')}</span>
              </button>

              <div className={styles.layerMenuDivider} />

              <button
                type="button"
                className={styles.layerMenuItem}
                onClick={() => {
                  setContextMenu({ open: false, x: 0, y: 0, target: 'pane' });
                  addCanvasMemo();
                }}
              >
                <StickyNote size={16} className={styles.layerMenuIcon} />
                <span>{t('Add Memo')}</span>
              </button>

              <div className={styles.layerMenuDivider} />

              <button
                type="button"
                className={styles.layerMenuItem}
                onClick={() => {
                  setContextMenu({ open: false, x: 0, y: 0, target: 'pane' });
                  goList();
                }}
              >
                <ArrowLeft size={16} className={styles.layerMenuIcon} />
                <span>{t('Exit')}</span>
              </button>
            </div>
          )}

          {/* 노드 우클릭 */}
          {contextMenu.open && contextMenu.target?.type === 'node' && (
            <div
              className={styles.layerMenu}
              style={{ left: contextMenu.x, top: contextMenu.y }}
            >
              <button
                type="button"
                className={styles.layerMenuItem}
                onClick={() => handleContextCopyNodes(contextMenu.target.id)}
              >
                <Copy size={16} className={styles.layerMenuIcon} />
                <span>{t('Copy Node')}</span>
              </button>

              <button
                type="button"
                className={styles.layerMenuItem}
                onClick={() => handleContextCutNodes(contextMenu.target.id)}
              >
                <Scissors size={16} className={styles.layerMenuIcon} />
                <span>{t('Cut Node')}</span>
              </button>

              <button
                type="button"
                className={`${styles.layerMenuItem} ${!clipboard ? styles.layerMenuItemDisabled : ''}`}
                onClick={() =>
                  handleContextPaste(contextMenu.flowPosition ?? null)
                }
                disabled={!clipboard}
              >
                <Clipboard size={16} className={styles.layerMenuIcon} />
                <span>{t('Paste')}</span>
              </button>

              <div className={styles.layerMenuDivider} />

              {(() => {
                const targetNode = nodes.find(
                  (n: any) => n.id === contextMenu.target.id,
                );
                if (!targetNode) return null;

                const currentInputPos =
                  targetNode?.data?.inputPosition ?? 'left';
                const nextInputPos =
                  currentInputPos === 'left' ? 'top' : 'left';

                const getOutputsForNode = (node: any) => {
                  if (node.type === 'branch') {
                    const isConditionType =
                      node.data?.evaluationType === 'CONDITION';
                    if (isConditionType) {
                      const conds = node.data?.conditions || [];
                      const list = conds.map((c: any, idx: number) => ({
                        id:
                          node.data?.replies?.[idx]?.value ||
                          c.id ||
                          String(idx),
                        label: `Output ${idx + 1} (${c.slot ? `{${c.slot}}` : '조건 ' + (idx + 1)})`,
                      }));
                      list.push({
                        id: 'default',
                        label: 'Output Default (기본)',
                      });
                      return list;
                    } else {
                      const replies = node.data?.replies || [];
                      return replies.map((r: any, idx: number) => ({
                        id: r.value,
                        label: `Output ${idx + 1} (${r.display || r.value})`,
                      }));
                    }
                  }

                  if (node.type === 'ynBranch') {
                    return [
                      { id: 'Y', label: 'Output Y (Yes)' },
                      { id: 'N', label: 'Output N (No)' },
                    ];
                  }

                  if (node.type === 'llm') {
                    const conds = node.data?.conditions || [];
                    const list = conds.map((c: any, idx: number) => ({
                      id: c.id || idx,
                      label: `Output ${idx + 1} (${c.slot ? `{${c.slot}}` : '조건 ' + (idx + 1)})`,
                    }));
                    list.push({
                      id: 'default',
                      label: 'Output Default (기본)',
                    });
                    return list;
                  }

                  if (node.type === 'api') {
                    return [
                      { id: 'onSuccess', label: 'Output Success (성공)' },
                      { id: 'onError', label: 'Output Error (오류)' },
                    ];
                  }

                  if (node.type === 'fixedmenu') {
                    const replies = node.data?.replies || [];
                    return replies.map((r: any, idx: number) => ({
                      id: r.value,
                      label: `Output ${idx + 1} (${r.display || r.value})`,
                    }));
                  }

                  return [{ id: 'default', label: 'Output (출력)' }];
                };

                const outputs = getOutputsForNode(targetNode);

                return (
                  <>
                    <button
                      type="button"
                      className={styles.layerMenuItem}
                      onClick={() => {
                        handleToggleInputPosition(
                          contextMenu.target.id,
                          nextInputPos,
                        );
                        closeContextMenu();
                      }}
                    >
                      <ArrowLeftToLine
                        size={16}
                        className={styles.layerMenuIcon}
                        style={{
                          transform:
                            currentInputPos === 'top'
                              ? 'rotate(90deg)'
                              : 'none',
                        }}
                      />
                      <span>
                        {currentInputPos === 'left'
                          ? t('Input 위치를 Top(상단)으로 변경')
                          : t('Input 위치를 Left(좌측)로 변경')}
                      </span>
                    </button>

                    <div className={styles.layerMenuDivider} />

                    <div style={{ padding: '4px 6px' }}>
                      <div
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#64748b',
                          marginBottom: '6px',
                          paddingLeft: '4px',
                        }}
                      >
                        {t('개별 Output 위치 설정')}
                      </div>
                      {outputs.map((out: any) => {
                        const currentPos =
                          targetNode.data?.outputPositions?.[out.id] ||
                          (targetNode.type === 'ynBranch' && out.id === 'N'
                            ? 'bottom'
                            : targetNode.type === 'api' && out.id === 'onError'
                              ? 'bottom'
                              : targetNode.data?.outputPosition || 'right');

                        return (
                          <div
                            key={out.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '8px',
                              padding: '4px 6px',
                              marginBottom: '4px',
                              borderRadius: '6px',
                              backgroundColor: '#f8fafc',
                              fontSize: '12px',
                            }}
                          >
                            <span
                              style={{
                                maxWidth: '120px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                color: '#334155',
                                fontWeight: 500,
                              }}
                              title={out.label}
                            >
                              {out.label}
                            </span>
                            <div style={{ display: 'flex', gap: '3px' }}>
                              <button
                                type="button"
                                style={{
                                  padding: '2px 6px',
                                  fontSize: '10px',
                                  fontWeight: 600,
                                  borderRadius: '4px',
                                  border: '1px solid #cbd5e1',
                                  backgroundColor:
                                    currentPos === 'right'
                                      ? '#2563eb'
                                      : '#ffffff',
                                  color:
                                    currentPos === 'right'
                                      ? '#ffffff'
                                      : '#64748b',
                                  cursor: 'pointer',
                                  width: 'auto',
                                }}
                                onClick={() => {
                                  handleSetIndividualOutputPosition(
                                    targetNode.id,
                                    out.id,
                                    'right',
                                  );
                                  closeContextMenu();
                                }}
                              >
                                Right
                              </button>
                              <button
                                type="button"
                                style={{
                                  padding: '2px 6px',
                                  fontSize: '10px',
                                  fontWeight: 600,
                                  borderRadius: '4px',
                                  border: '1px solid #cbd5e1',
                                  backgroundColor:
                                    currentPos === 'bottom'
                                      ? '#2563eb'
                                      : '#ffffff',
                                  color:
                                    currentPos === 'bottom'
                                      ? '#ffffff'
                                      : '#64748b',
                                  cursor: 'pointer',
                                  width: 'auto',
                                }}
                                onClick={() => {
                                  handleSetIndividualOutputPosition(
                                    targetNode.id,
                                    out.id,
                                    'bottom',
                                  );
                                  closeContextMenu();
                                }}
                              >
                                Bottom
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                );
              })()}

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
                <span>{t('Delete Node')}</span>
              </button>
            </div>
          )}

          {/* 엣지 우클릭 */}
          {contextMenu.open && contextMenu.target?.type === 'edge' && (
            <div
              className={styles.layerMenu}
              style={{ left: contextMenu.x, top: contextMenu.y }}
            >
              <button
                type="button"
                className={styles.layerMenuItem}
                onClick={() => {
                  handleAddYNBranchNode(contextMenu.target.id);
                  closeContextMenu();
                }}
              >
                <GitFork size={16} className={styles.layerMenuIcon} />
                <span>{t('Y/N 분기 노드 추가')}</span>
              </button>

              <div className={styles.layerMenuDivider} />

              <button
                type="button"
                className={styles.layerMenuItem}
                onClick={() => {
                  deleteEdge(contextMenu.target.id);
                  closeContextMenu();
                }}
              >
                <Trash2 size={16} className={styles.layerMenuIcon} />
                <span>{t('Delete Edge')}</span>
              </button>
            </div>
          )}

          {/* select 영역 */}
          {contextMenu.open && contextMenu.target?.type === 'selection' && (
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
                <span>{t('Copy Selected Nodes')}</span>
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
                <span>{t('Cut Selected Nodes')}</span>
              </button>

              <button
                type="button"
                className={`${styles.layerMenuItem} ${!clipboard ? styles.layerMenuItemDisabled : ''}`}
                onClick={() => {
                  handleContextPaste(contextMenu.flowPosition ?? null);
                }}
                disabled={!clipboard}
              >
                <Clipboard size={16} className={styles.layerMenuIcon} />
                <span>{t('Paste')}</span>
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

        <div
          className={`${styles.controllerPanel} ${selectedNodeId ? styles.visible : ''}`}
        >
          <NodeController />
        </div>

        <div
          className={`${styles.resizerV} ${isSimulatorVisible && !isSimulatorExpanded ? styles.visible : ''}`}
          onMouseDown={handleMainResize}
        />

        <div
          className={`${styles.rightContainer} ${isSimulatorVisible ? styles.visible : ''}`}
          style={{
            width: isSimulatorExpanded
              ? 'max(600px, 50%)'
              : isSimulatorVisible
                ? `${rightPanelWidth}px`
                : '0',
          }}
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
      </Box>

      {/* 모달 팝업 ==================================================================== */}
      {/* add node modal */}
      <ActivityPickerModal
        open={Boolean(insertTarget)}
        search={activitySearch}
        recentTypes={recentTypes}
        // hiddenTypes={
        //   userInfoJson.unuse_nodes && !insertTarget?.targetId
        //     ? userInfoJson.unuse_nodes
        //     : insertTarget?.targetId
        //       ? unuseNodes
        //       : []
        // }
        onSearchChange={setActivitySearch}
        onClose={closeActivityPicker}
        onSelect={handleSelectActivity}
      />
      {/* Execution Log */}
      <Dialog
        open={isExecutionLogVisible}
        onClose={() => setIsExecutionLogVisible(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">{t('Execution Log')}</Typography>
            <IconButton onClick={() => setIsExecutionLogVisible(false)}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          {executionError && (
            <Box
              sx={{
                mb: 2,
                p: 2,
                bgcolor: '#fdeded',
                color: '#5f2120',
                borderRadius: 1,
              }}
            >
              <Typography variant="body2">{executionError}</Typography>
            </Box>
          )}
          <Box
            sx={{
              bgcolor: '#1e1e1e',
              color: '#4af626',
              p: 2,
              borderRadius: 1,
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              overflow: 'auto',
              maxHeight: '60vh',
            }}
          >
            <pre
              style={{
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}
            >
              {JSON.stringify(executionLogs, null, 2)}
            </pre>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setIsExecutionLogVisible(false)}
            variant="contained"
          >
            {t('Close')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* isLogVisible 로 hidden / flex 전환 */}
      <Dialog
        open={isLogVisible}
        onClose={() => setIsLogVisible(false)}
        fullWidth
        maxWidth="lg" // JSON 데이터는 가로로 길 수 있으므로 lg 권장
      >
        <DialogTitle>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">{`${t('Log')} (${t('DB JSON Edit')})`}</Typography>
            <IconButton onClick={() => setIsLogVisible(false)}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <LogPreview
            nodes={nodes}
            edges={edges}
            setNodes={setNodes}
            setEdges={setEdges}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsLogVisible(false)} variant="outlined">
            {t('Cancel')}
          </Button>
          {/* LogPreview 내부에 저장 로직이 있다면 버튼을 추가하거나 내부 버튼을 사용하세요 */}
        </DialogActions>
      </Dialog>

      {/* play 시 branch node type 모달 */}
      <Dialog
        open={!!pendingBranchSelection}
        onClose={cancelBranchReplySelection}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ fontWeight: 700 }}>{t('Select Branch')}</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
            {pendingBranchSelection?.title ||
              t('Please select the flow that you want to proceed with.')}
          </Typography>
          <Stack spacing={1.5}>
            {pendingBranchSelection?.replies.map((reply: any) => (
              <Button
                key={reply.value}
                fullWidth
                variant="outlined"
                onClick={() => selectBranchReply(reply.value)}
                sx={{
                  justifyContent: 'flex-start',
                  py: 1.5,
                  px: 2,
                  textAlign: 'left',
                  borderColor: 'divider',
                  '&:hover': {
                    bgcolor: 'primary.light',
                    color: 'primary.contrastText',
                  },
                }}
              >
                {reply.display}
              </Button>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={cancelBranchReplySelection} color="inherit">
            {t('Cancel')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* play form input modal */}
      <Dialog
        open={!!pendingFormInput}
        onClose={cancelFormInput}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {pendingFormInput?.title || t('Form input')}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ py: 0.5 }}>
            {executionFormElements.map((element, elementIndex) => {
              const elementName = getExecutionElementKey(element, elementIndex);
              const label =
                element.label ||
                element.name ||
                element.type ||
                `Element ${elementIndex + 1}`;
              const value = executionFormValues[elementName];
              const slotValue = element.optionsSlot
                ? pendingFormInput?.slots?.[element.optionsSlot]
                : undefined;

              if (element.type === 'checkbox') {
                const options =
                  Array.isArray(slotValue) && slotValue.length > 0
                    ? (slotValue as ExecutionFormOption[])
                    : element.options || [];
                const checkedValues = Array.isArray(value) ? value : [];

                return (
                  <Box key={element.id || element.name}>
                    <Typography
                      variant="subtitle2"
                      sx={{ mb: 0.75, fontWeight: 600 }}
                    >
                      {label}
                    </Typography>
                    <Stack spacing={0.5}>
                      {options.length === 0 && (
                        <Typography
                          variant="body2"
                          sx={{ color: 'text.secondary' }}
                        >
                          {t('No options')}
                        </Typography>
                      )}
                      {options.map((option, index: number) => {
                        const { value: optionValue, label: optionLabel } =
                          normalizeExecutionFormOption(option, index);

                        return (
                          <FormControlLabel
                            key={`${elementName}-${optionValue || index}`}
                            control={
                              <Checkbox
                                checked={checkedValues.includes(optionValue)}
                                onChange={(event) =>
                                  updateExecutionFormCheckbox(
                                    elementName,
                                    optionValue,
                                    event.target.checked,
                                    element,
                                  )
                                }
                                size="small"
                              />
                            }
                            label={optionLabel}
                            sx={{
                              m: 0,
                              '& .MuiFormControlLabel-label': {
                                fontSize: 14,
                              },
                            }}
                          />
                        );
                      })}
                    </Stack>
                  </Box>
                );
              }

              if (element.type === 'dropbox') {
                const options =
                  Array.isArray(slotValue) && slotValue.length > 0
                    ? (slotValue as ExecutionFormOption[])
                    : element.options || [];

                return (
                  <FormControl
                    key={element.id || element.name}
                    fullWidth
                    size="small"
                  >
                    <InputLabel>{label}</InputLabel>
                    <Select
                      label={label}
                      value={String(value ?? '')}
                      onChange={(event) =>
                        updateExecutionFormValue(
                          elementName,
                          event.target.value,
                          element,
                        )
                      }
                    >
                      <MenuItem value="">
                        <em>{t('Select')}</em>
                      </MenuItem>
                      {options.map((option, index: number) => {
                        const { value: optionValue, label: optionLabel } =
                          normalizeExecutionFormOption(option, index);

                        return (
                          <MenuItem
                            key={`${optionValue || index}`}
                            value={optionValue}
                          >
                            {optionLabel}
                          </MenuItem>
                        );
                      })}
                    </Select>
                  </FormControl>
                );
              }

              if (element.type === 'grid') {
                const slotGridData = Array.isArray(slotValue)
                  ? slotValue
                  : null;
                const gridData =
                  slotGridData && slotGridData.length > 0
                    ? slotGridData
                    : element.data || [];
                const objectRows = gridData.filter(
                  (row): row is Record<string, unknown> =>
                    typeof row === 'object' &&
                    row !== null &&
                    !Array.isArray(row),
                );
                const hasObjectRows =
                  objectRows.length > 0 &&
                  objectRows.length === gridData.length;

                if (hasObjectRows) {
                  const columns = getGridDisplayColumns(element, objectRows);

                  return (
                    <Box key={element.id || elementName}>
                      <Typography
                        variant="subtitle2"
                        sx={{ mb: 0.75, fontWeight: 600 }}
                      >
                        {t(label)}
                      </Typography>
                      <Box sx={{ overflowX: 'auto' }}>
                        <Box
                          component="table"
                          sx={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            '& th, & td': {
                              border: '1px solid',
                              borderColor: 'divider',
                              px: 1,
                              py: 0.75,
                              fontSize: 13,
                              textAlign: 'left',
                            },
                            '& th': {
                              bgcolor: 'grey.50',
                              fontWeight: 700,
                            },
                          }}
                        >
                          <thead>
                            <tr>
                              {columns.map((column) => (
                                <th key={column.key}>{column.label}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {objectRows.map((row, rowIndex) => (
                              <tr key={`${elementName}-${rowIndex}`}>
                                {columns.map((column) => (
                                  <td key={column.key}>
                                    {String(row[column.key] ?? '')}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </Box>
                      </Box>
                    </Box>
                  );
                }

                const rows = element.rows || 2;
                const columns = element.columns || 2;
                const flatGridData = gridData.flatMap((item) =>
                  Array.isArray(item) ? item : [item],
                );

                return (
                  <Box key={element.id || elementName}>
                    <Typography
                      variant="subtitle2"
                      sx={{ mb: 0.75, fontWeight: 600 }}
                    >
                      {t(label)}
                    </Typography>
                    <Box sx={{ overflowX: 'auto' }}>
                      <Box
                        component="table"
                        sx={{
                          width: '100%',
                          borderCollapse: 'collapse',
                          '& td': {
                            border: '1px solid',
                            borderColor: 'divider',
                            px: 1,
                            py: 0.75,
                            fontSize: 13,
                            minWidth: 80,
                          },
                        }}
                      >
                        <tbody>
                          {Array.from({ length: rows }).map((_, rowIndex) => (
                            <tr key={`${elementName}-${rowIndex}`}>
                              {Array.from({ length: columns }).map(
                                (__, columnIndex) => {
                                  const cellIndex =
                                    rowIndex * columns + columnIndex;
                                  return (
                                    <td key={columnIndex}>
                                      {String(flatGridData[cellIndex] ?? '')}
                                    </td>
                                  );
                                },
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </Box>
                    </Box>
                  </Box>
                );
              }

              return (
                <TextField
                  key={element.id || elementName}
                  fullWidth
                  size="small"
                  label={label}
                  type={element.type === 'date' ? 'date' : 'text'}
                  value={String(value ?? '')}
                  placeholder={t('element.placeholder') || ''}
                  onChange={(event) =>
                    updateExecutionFormValue(
                      elementName,
                      event.target.value,
                      element,
                    )
                  }
                  InputLabelProps={
                    element.type === 'date' ? { shrink: true } : undefined
                  }
                />
              );
            })}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={cancelFormInput} color="inherit">
            {t('Cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={() => submitFormInput(executionFormValues)}
          >
            {t('Submit')}
          </Button>
        </DialogActions>
      </Dialog>

      <ActivityPickerModal
        open={Boolean(insertTarget)}
        search={activitySearch}
        recentTypes={recentTypes}
        onSearchChange={setActivitySearch}
        onClose={closeActivityPicker}
        onSelect={handleSelectActivity}
      />

      {/* Scenario Loading Overlay */}
      <Backdrop
        open={isLoadingScenario}
        sx={{
          color: '#fff',
          zIndex: (theme) => theme.zIndex.drawer + 999,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        }}
      >
        <CircularProgress color="inherit" size={50} />
        <Typography variant="h6" color="inherit">
          {t('Loading scenario data...')}
        </Typography>
      </Backdrop>

      {/* ======================================================================================== */}
    </Box>
  );
};

function ScenarioFlow(props: any) {
  // scenario, backend, scenarios
  const fetchScenarios = useBuilderStore((s: any) => s.fetchScenarios);
  const selectedScenario = useBuilderStore((s: any) => s.scenario);
  const scenarios = useBuilderStore((s: any) => s.scenarios);
  const setScenarios = useBuilderStore((s: any) => s.setScenarios);
  // console.log('selectedScenario==========================> ', selectedScenario);
  // console.log('scenarios==========================> ', scenarios);

  useEffect(() => {
    const scenarioLoad = async () => {
      const res = await fetchScenarios({});
      setScenarios(res);
    };

    scenarioLoad();
  }, [setScenarios]);

  return (
    <ReactFlowProvider>
      <Flow {...props} scenario={selectedScenario} scenarios={scenarios} />
    </ReactFlowProvider>
  );
}

export default ScenarioFlow;
