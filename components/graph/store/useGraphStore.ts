import { create } from 'zustand';
import type { Node, Edge } from '@xyflow/react';
import type {
  GraphStyleConfig,
  MappingRule,
  EdgeStyleConfig,
} from '@/lib/types/graphStyle';
import type { LocalGraphChanges, NodeProperties } from '@/lib/types/graph';

interface GraphState {
  // Full style config (single source of truth)
  styleConfig: GraphStyleConfig | null;
  styleLoading: boolean;

  // Flat fields derived from styleConfig — kept for granular selectors (avoids re-renders)
  mappingRules: MappingRule[];
  edgeStyles: Record<string, EdgeStyleConfig>;

  // UI & Active tool states
  activeEdgeType: string;
  currentTool: 'select' | 'pan';
  isRulesModalOpen: boolean;

  // Popup mode: nodes picked by user (Ctrl+Click), exposed for parent consumers
  popupSelectedNodes: Map<
    string,
    {
      id: string;
      type?: string;
      data: Record<string, any>;
    }
  >;

  // Discrete change tracking states
  localChanges: LocalGraphChanges;

  // Document & Chunk cache states for SourceDocumentsTab
  docViewerUrlCache: Map<string, string>;
  chunkBboxCache: Map<string, any>;

  // Actions
  initStyles: (config: GraphStyleConfig) => void;
  setActiveEdgeType: (type: string) => void;
  setTool: (tool: 'select' | 'pan') => void;
  setRulesModalOpen: (open: boolean) => void;
  togglePopupSelectedNode: (node: {
    id: string;
    type?: string;
    data: Record<string, any>;
  }) => void;
  clearPopupSelectedNodes: () => void;

  setDocViewerUrlCache: (docuFilId: string, url: string) => void;
  setChunkBboxCache: (cacheKey: string, data: any) => void;
  clearDocumentCache: () => void;

  trackNodeAdded: (node: Node) => void;
  trackNodeModified: (id: string, properties: Partial<NodeProperties>) => void;
  trackNodeDeleted: (id: string, connectedEdgeIds: string[]) => void;
  trackEdgeAdded: (edge: Edge) => void;
  trackEdgeDeleted: (id: string) => void;
  trackEdgeModified: (id: string, edgeData: Record<string, any>) => void;
  clearChanges: () => void;
}

const MAX_DOC_CACHE_SIZE = 20;

export const useGraphStore = create<GraphState>((set) => ({
  styleConfig: null,
  styleLoading: true,
  mappingRules: [],
  edgeStyles: {},
  activeEdgeType: 'INCLUDE',
  currentTool: 'select',
  isRulesModalOpen: false,
  popupSelectedNodes: new Map(),
  localChanges: {
    addedNodes: [],
    modifiedNodes: new Map(),
    deletedNodeIds: new Set(),
    addedEdges: [],
    deletedEdgeIds: new Set(),
    modifiedEdges: new Map(),
  },

  docViewerUrlCache: new Map(),
  chunkBboxCache: new Map(),

  initStyles: (config) =>
    set({
      styleConfig: config,
      styleLoading: false,
      mappingRules: config.mappingRules,
      edgeStyles: config.edgeStyles,
    }),
  setActiveEdgeType: (type) => set({ activeEdgeType: type }),
  setTool: (tool) => set({ currentTool: tool }),
  setRulesModalOpen: (open) => set({ isRulesModalOpen: open }),
  togglePopupSelectedNode: (node) =>
    set((state) => {
      const next = new Map(state.popupSelectedNodes);
      if (next.has(node.id)) {
        next.delete(node.id);
      } else {
        next.set(node.id, node);
      }
      return { popupSelectedNodes: next };
    }),
  clearPopupSelectedNodes: () => set({ popupSelectedNodes: new Map() }),

  setDocViewerUrlCache: (docuFilId, url) =>
    set((state) => {
      const next = new Map(state.docViewerUrlCache);
      if (next.size >= MAX_DOC_CACHE_SIZE) {
        const oldestKey = next.keys().next().value;
        if (oldestKey) next.delete(oldestKey);
      }
      next.set(docuFilId, url);
      return { docViewerUrlCache: next };
    }),

  setChunkBboxCache: (cacheKey, data) =>
    set((state) => {
      const next = new Map(state.chunkBboxCache);
      if (next.size >= MAX_DOC_CACHE_SIZE) {
        const oldestKey = next.keys().next().value;
        if (oldestKey) next.delete(oldestKey);
      }
      next.set(cacheKey, data);
      return { chunkBboxCache: next };
    }),

  clearDocumentCache: () =>
    set({
      docViewerUrlCache: new Map(),
      chunkBboxCache: new Map(),
    }),

  trackNodeAdded: (node) =>
    set((state) => {
      const changes = { ...state.localChanges };
      changes.addedNodes = [...changes.addedNodes, node];
      return { localChanges: changes };
    }),

  trackNodeModified: (id, properties) =>
    set((state) => {
      const changes = { ...state.localChanges };
      const addedNodeIndex = changes.addedNodes.findIndex((n) => n.id === id);
      if (addedNodeIndex > -1) {
        changes.addedNodes = [...changes.addedNodes];
        changes.addedNodes[addedNodeIndex] = {
          ...changes.addedNodes[addedNodeIndex],
          data: {
            ...changes.addedNodes[addedNodeIndex].data,
            ...properties,
            label:
              properties.name ||
              properties.label ||
              changes.addedNodes[addedNodeIndex].data.label,
          },
        };
      } else {
        const nextModifiedNodes = new Map(changes.modifiedNodes);
        const existing = nextModifiedNodes.get(id) || {};
        nextModifiedNodes.set(id, { ...existing, ...properties });
        changes.modifiedNodes = nextModifiedNodes;
      }
      return { localChanges: changes };
    }),

  trackNodeDeleted: (id, connectedEdgeIds) =>
    set((state) => {
      const changes = { ...state.localChanges };
      const wasAddedLocally = changes.addedNodes.some((n) => n.id === id);
      changes.addedNodes = changes.addedNodes.filter((n) => n.id !== id);

      const nextModifiedNodes = new Map(changes.modifiedNodes);
      nextModifiedNodes.delete(id);
      changes.modifiedNodes = nextModifiedNodes;

      if (!wasAddedLocally) {
        const nextDeletedNodeIds = new Set(changes.deletedNodeIds);
        nextDeletedNodeIds.add(id);
        changes.deletedNodeIds = nextDeletedNodeIds;
      }

      const nextDeletedEdgeIds = new Set(changes.deletedEdgeIds);
      let updatedAddedEdges = [...changes.addedEdges];

      connectedEdgeIds.forEach((edgeId) => {
        const edgeWasAddedLocally = changes.addedEdges.some(
          (e) => e.id === edgeId,
        );
        updatedAddedEdges = updatedAddedEdges.filter((e) => e.id !== edgeId);
        if (!edgeWasAddedLocally) {
          nextDeletedEdgeIds.add(edgeId);
        }
      });

      const nextModifiedEdges = new Map(changes.modifiedEdges);
      connectedEdgeIds.forEach((edgeId) => nextModifiedEdges.delete(edgeId));

      changes.addedEdges = updatedAddedEdges;
      changes.deletedEdgeIds = nextDeletedEdgeIds;
      changes.modifiedEdges = nextModifiedEdges;

      return { localChanges: changes };
    }),

  trackEdgeAdded: (edge) =>
    set((state) => {
      const changes = { ...state.localChanges };
      changes.addedEdges = [...changes.addedEdges, edge];
      return { localChanges: changes };
    }),

  trackEdgeDeleted: (id) =>
    set((state) => {
      const changes = { ...state.localChanges };
      const wasAddedLocally = changes.addedEdges.some((e) => e.id === id);
      changes.addedEdges = changes.addedEdges.filter((e) => e.id !== id);

      const nextModifiedEdges = new Map(changes.modifiedEdges);
      nextModifiedEdges.delete(id);
      changes.modifiedEdges = nextModifiedEdges;

      if (!wasAddedLocally) {
        const nextDeletedEdgeIds = new Set(changes.deletedEdgeIds);
        nextDeletedEdgeIds.add(id);
        changes.deletedEdgeIds = nextDeletedEdgeIds;
      }

      return { localChanges: changes };
    }),

  trackEdgeModified: (id, edgeData) =>
    set((state) => {
      const changes = { ...state.localChanges };
      const addedEdgeIndex = changes.addedEdges.findIndex((e) => e.id === id);
      if (addedEdgeIndex > -1) {
        changes.addedEdges = [...changes.addedEdges];
        changes.addedEdges[addedEdgeIndex] = {
          ...changes.addedEdges[addedEdgeIndex],
          ...edgeData,
        };
      } else {
        const nextModifiedEdges = new Map(changes.modifiedEdges);
        const existing = nextModifiedEdges.get(id) || {};
        nextModifiedEdges.set(id, { ...existing, ...edgeData });
        changes.modifiedEdges = nextModifiedEdges;
      }
      return { localChanges: changes };
    }),

  clearChanges: () =>
    set({
      localChanges: {
        addedNodes: [],
        modifiedNodes: new Map(),
        deletedNodeIds: new Set(),
        addedEdges: [],
        deletedEdgeIds: new Set(),
        modifiedEdges: new Map(),
      },
    }),
}));
