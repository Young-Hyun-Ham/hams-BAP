import type { Node, Edge } from 'reactflow';
import { makeSnapshot, type StoreState } from './index';
import useBuilderHistoryStore from './historyStore';

export type EdgePoint = { x: number; y: number };

type SetState = (
  partial:
    | Partial<StoreState>
    | ((state: StoreState) => Partial<StoreState> | StoreState)
) => void;

type GetState = () => StoreState;

type EdgeControlActionSlice = Pick<
  StoreState,
  'updateEdgeSegment' | 'updateEdgePoints'
>;

function stripUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefinedDeep(item)) as T;
  }

  if (value && typeof value === 'object') {
    const next: Record<string, unknown> = {};

    Object.entries(value as Record<string, unknown>).forEach(([key, current]) => {
      if (current === undefined) return;
      next[key] = stripUndefinedDeep(current);
    });

    return next as T;
  }

  return value;
}

export function createEdgeControlActionStore(
  set: SetState,
  get: GetState
): EdgeControlActionSlice {
  return {
    updateEdgeSegment: (edgeId, points) => {
      useBuilderHistoryStore.getState().push(makeSnapshot(get()));
      
      set((state) => ({
        edges: state.edges.map((edge) =>
          edge.id === edgeId
            ? {
                ...edge,
                data: {
                  ...(edge.data ?? {}),
                  points,
                  updateEdgeSegment: get().updateEdgeSegment,
                },
              }
            : edge
        ),
      }));
    },

    updateEdgePoints: (edgeId, points) => {
      useBuilderHistoryStore.getState().push(makeSnapshot(get()));
      
      set((state) => ({
        edges: state.edges.map((edge) =>
          edge.id === edgeId
            ? {
                ...edge,
                data: {
                  ...(edge.data ?? {}),
                  points,
                },
              }
            : edge
        ),
      }));
    },
  };
}

export function sanitizeNodesForSave(nodes: Node<any>[]): Node<any>[] {
  return nodes.map((node) => stripUndefinedDeep(node));
}


export function sanitizeEdgesForSave(edges: Edge<any>[]): Edge<any>[] {
  return edges.map((edge) => {
    const cleanedData = edge.data
      ? (() => {
          const { updateEdgeSegment, updateEdgePoints, ...restData } = edge.data;
          return restData;
        })()
      : undefined;

    return stripUndefinedDeep({
      ...edge,
      data: cleanedData,
    });
  });
}

