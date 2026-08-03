import { Node } from 'reactflow';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Scenario = {
  id?: string;
  category_id?: string;
  edges?: any[];
  nodes?: any[];
  job?: string;
  name: string;
  startNodeId?: string;
  description: string;
  version_yn?: boolean;
  ltst_ver_id?: any;
  depn_ver_id?: any;
  [key: string]: any;
};
/* eslint-enable @typescript-eslint/no-explicit-any */

type TreeItem = {
  id: string;
  index: number;
  label: string;
  type?: string;
  children: TreeItem[];
};

type VersionTreeItem = {
  id: string;
  index: number;
  label: string;
  type?: string;
  snro_id?: string;
  ver_id?: string;
  depn_yn?: string;
  children: VersionTreeItem[];
};

type DB_TYPE = 'fastapi' | 'firebase';

type UserInfo = {
  id: string;
  user_id: string;
  user_name: string;
  roles: string[];
  unuse_form_elements: string[];
  unuse_nodes: string[];
  node_colors?: Record<string, string>;
};

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

type BuilderNodeData = {
  id?: string;
  label?: string;
  title?: string;
  content?: string;
  replies?: Array<{ display?: string; value?: string }>;
  conditions?: Array<any>;
  evaluationType?: string;
  flowCollapsed?: boolean;
  flowGroupHeight?: number;
  [key: string]: any;
};

type BuilderNode = Node<BuilderNodeData>;

export type {
  Scenario,
  TreeItem,
  VersionTreeItem,
  DB_TYPE,
  UserInfo,
  InsertTarget,
  AddNodeData,
  BuilderNodeData,
  BuilderNode,
};
