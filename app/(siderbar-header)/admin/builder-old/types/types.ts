// app/(content-header)/builder/types/types.ts

type Scenarios = {
  id: string;
  edges?: any[];
  nodes?: any[];
  job?: string;
  name: string;
  startNodeId?: string;
  description: string;
  [key: string]: any;
};

type BackendKind = 'firebase' | 'fastapi' | 'mock';

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

type UserInfo = {
  id: string;
  user_id: string;
  user_name: string;
  roles: string[];
  unuse_form_elements: string[];
  unuse_nodes: string[];
  node_colors?: Record<string, string>;
};

export type { 
  Scenarios,
  BackendKind,
  TreeItem, 
  VersionTreeItem, 
  UserInfo,
};