import type { Edge } from 'reactflow';
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

export function sanitizeEdgesForSave(edges: Edge<any>[]): Edge<any>[] {
  return edges.map((edge) => {
    if (!edge.data) {
      return edge;
    }

    const { updateEdgeSegment, updateEdgePoints, ...restData } = edge.data;

    return {
      ...edge,
      data: restData,
    };
  });
}
