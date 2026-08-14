/**
 * Node level hierarchy used by the graph.
 * Internal code uses L1–L4; the UI displays them as Stream, Module, Process, Rule.
 */
export type NodeLevel = 'L1' | 'L2' | 'L3' | 'L4';

export type GraphEditorMode = 'main' | 'popup';

/**
 * Typed properties that every graph node carries.
 * Since the backend is a graph DB, arbitrary extra properties may appear,
 * so the index signature is kept for backward compatibility.
 */
export interface NodeProperties {
  name: string;
  ten_id: string;
  stg_id: string;
  node_id: string;
  created_at?: string;
  created_by?: string;
  updated_at?: string;
  updated_by?: string;
  /** L4 (Chunk) only — chunk identifier. */
  chnk_id?: string;
  /** L4 (Chunk) only — document file identifier. */
  docu_fil_id?: string;
  /** Optional description — can be added to any node in graph DB. */
  desc?: string;
  /** Allow additional dynamic properties from graph DB. */
  [key: string]: any;
}

/**
 * A node as returned by the visualization API and consumed by the FE.
 * The `id` is stringified from the BE numeric id by the transform layer.
 */
export interface GraphNode {
  id: string;
  label: NodeLevel;
  properties: NodeProperties;
}

/**
 * An edge as consumed by the FE.
 * `source` / `target` are mapped from BE `start_id` / `end_id` by the transform layer.
 */
export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  properties: Record<string, any>;
}

/** Raw edge shape as returned by the BE (before transform). */
export interface RawGraphEdge {
  id: number;
  label: string;
  source: number;
  target: number;
  properties: Record<string, any>;
}

/** Raw node shape as returned by the BE (before transform). */
export interface RawGraphNode {
  id: number;
  label: NodeLevel;
  properties: NodeProperties;
}

export interface VisualizationDataRes {
  nodes: GraphNode[];
  edges: GraphEdge[];
  total_nodes: number;
  total_edges: number;
}

/** Raw response shape from the BE before transformation. */
export interface RawVisualizationDataRes {
  nodes: RawGraphNode[];
  edges: RawGraphEdge[];
  total_nodes: number;
  total_edges: number;
}

export interface GraphChangesReq {
  addedNodes: {
    id: string;
    label: NodeLevel;
    properties: Partial<NodeProperties>;
  }[];
  modifiedNodes: {
    id: string;
    label?: NodeLevel;
    properties: Partial<NodeProperties>;
  }[];
  deletedNodeIds: string[];
  addedEdges: {
    source: string;
    target: string;
    label: string;
  }[];
  deletedEdgeIds: string[];
  modifiedEdges: {
    id: string;
    label: string;
  }[];
}

export interface LocalGraphChanges {
  addedNodes: import('@xyflow/react').Node[];
  modifiedNodes: Map<string, Partial<NodeProperties>>;
  deletedNodeIds: Set<string>;
  addedEdges: import('@xyflow/react').Edge[];
  deletedEdgeIds: Set<string>;
  modifiedEdges: Map<string, Record<string, any>>;
}

export interface ChnkBBoxInfo {
  chnk_id: string;
  page_nr: string;
  pos_lft_val: string;
  pos_top_val: string;
  pos_rgt_val: string;
  pos_bttm_val: string;
}

export interface GraphPredictionRequest {
  ten_id: string;
  stg_id: string;
  conv_id: string;
  question: string;
}
