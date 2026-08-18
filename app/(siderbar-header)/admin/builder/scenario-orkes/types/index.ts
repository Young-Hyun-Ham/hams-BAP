import { type Edge, Node } from 'reactflow';

type ScenarioSummary = {
  id?: string;
  name?: string;
  scenario_nm?: string;
};

type BuilderNodeData = {
  id?: string;
  label?: string;
  title?: string;
  replies?: Array<{ display?: string; value?: string }>;
  conditions?: Array<{ id?: string; value?: string }>;
  evaluationType?: string;
  flowCollapsed?: boolean;
  flowGroupHeight?: number;
};

type BuilderNode = Node<BuilderNodeData>;
type BuilderEdge = Edge<unknown>;

type InsertTarget = {
  sourceId?: string | null;
  sourceHandle?: string | null;
  targetId?: string | null;
  parentId?: string | null;
};

type AddNodeData = {
  target: InsertTarget;
  onAdd: (target: InsertTarget) => void;
};

type NodeSize = {
  width: number;
  height: number;
};

// canvas context menu type
type ContextMenuState = {
  open: boolean;
  x: number;
  y: number;
  flowPosition?: { x: number; y: number } | null;
  target: any;
};

// flow canvas play
type ExecutionFormElement = {
  id?: string;
  name?: string;
  type?: string;
  label?: string;
  placeholder?: string;
  options?: Array<string | { label?: string; value?: string; param?: string }>;
  sendByOption?: boolean;
  allowDeselection?: boolean;
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
type ExecutionFormOption = string | {
  label?: string;
  value?: string;
  param?: string;
};

// Sidebar menu data
type SidebarMenuData = {
  stream: string;
  module: string;
  isLeaf: boolean;
  pgmId: string;
  scenarioData?: any;
  isScenario?: boolean;
};

export type {
  ScenarioSummary,
  BuilderNodeData,
  BuilderNode,
  BuilderEdge,
  InsertTarget,
  AddNodeData,
  NodeSize,
  ContextMenuState,
  ExecutionFormElement,
  ExecutionFormOption,
  SidebarMenuData,
};
