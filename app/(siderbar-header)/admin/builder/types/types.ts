import { Timestamp } from 'next/dist/server/lib/cache-handlers/types';
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
  InsertTarget,
  AddNodeData,
  BuilderNodeData,
  BuilderNode,
};

export const LOCALE_LIST = [
  { value: "ko", label: "Korea" },
  { value: "en", label: "America" },
  { value: "vn", label: "Vietnam" },
  { value: "jp", label: "Japan" },
] as const;

export type LOCALE_TIME = typeof LOCALE_LIST[number]["value"];
export type LOCALE_TIME_TYPE = {
  date: Timestamp;
  locale: LOCALE_TIME;
}