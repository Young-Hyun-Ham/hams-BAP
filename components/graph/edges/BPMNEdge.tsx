import React, { useCallback, useContext, useMemo } from 'react';
import {
  useReactFlow,
  EdgeProps,
  EdgeLabelRenderer,
  BaseEdge,
  getStraightPath,
  getSmoothStepPath,
  useStore,
  Edge,
} from '@xyflow/react';
import { alpha, IconButton } from '@mui/material';
import { Wrench, Trash2 } from 'lucide-react';

import { useGraphStore } from '../store/useGraphStore';

/**
 * Custom edge component for the graph editor.
 * Renders straight or step paths based on the `data.pathType` property.
 * When selected, shows action buttons (edit type, delete) and endpoint indicators.
 */
const BPMNEdgeComponent = ({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerStart,
  markerEnd,
  selected,
  data,
  label,
}: EdgeProps) => {
  const { setEdges } = useReactFlow();
  const sourceNode = useStore(
    useCallback(
      (s: any) => {
        if (s.nodeLookup) return s.nodeLookup.get(source);
        return s.nodes.find((n: any) => n.id === source);
      },
      [source],
    ),
  );

  const targetNode = useStore(
    useCallback(
      (s: any) => {
        if (s.nodeLookup) return s.nodeLookup.get(target);
        return s.nodes.find((n: any) => n.id === target);
      },
      [target],
    ),
  );

  const isSourceSelected = sourceNode?.selected ?? false;
  const isTargetSelected = targetNode?.selected ?? false;

  const sourceRadius =
    (sourceNode?.measured?.width || sourceNode?.width || 90) / 2;
  const targetRadius =
    (targetNode?.measured?.width || targetNode?.width || 90) / 2;

  const isConnected = isSourceSelected || isTargetSelected;

  const mergedStyle = {
    ...style,
    strokeWidth: isConnected ? 3 : (style.strokeWidth ?? 2),
  };
  const getHandleOffset = (position: string) => {
    switch (position) {
      case 'left':
        return { x: 8, y: 0 };
      case 'right':
        return { x: -8, y: 0 };
      case 'top':
        return { x: 0, y: 8 };
      case 'bottom':
        return { x: 0, y: -8 };
      default:
        return { x: 0, y: 0 };
    }
  };

  const sourceOffset = getHandleOffset(sourcePosition || 'right');
  const targetOffset = getHandleOffset(targetPosition || 'left');

  const sourceCenterX = sourceX + sourceOffset.x;
  const sourceCenterY = sourceY + sourceOffset.y;
  const targetCenterX = targetX + targetOffset.x;
  const targetCenterY = targetY + targetOffset.y;

  const dx = targetCenterX - sourceCenterX;
  const dy = targetCenterY - sourceCenterY;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;

  const ux = dx / len;
  const uy = dy / len;
  const nx = -uy;
  const ny = ux;

  // Optimize by only triggering a re-render if the count or index of parallel edges for THIS pair changes.
  const { count, index } = useStore(
    useCallback(
      (s: any) => {
        const list = (s.edges || [])
          .filter(
            (e: Edge) =>
              (e.source === source && e.target === target) ||
              (e.source === target && e.target === source),
          )
          .sort((a: Edge, b: Edge) => a.id.localeCompare(b.id));

        const idx = list.findIndex((e: Edge) => e.id === id);
        return { count: list.length, index: idx };
      },
      [source, target, id],
    ),
    (oldVal, newVal) =>
      oldVal.count === newVal.count && oldVal.index === newVal.index,
  );

  const hasMultipleEdges = count > 1;

  const isCanonical = source.localeCompare(target) < 0;
  const directionMultiplier = isCanonical ? 1 : -1;

  // Symmetric distribution multiplier around the center (e.g. -0.5, 0.5 or -1, 0, 1)
  const multiplier = hasMultipleEdges ? index - (count - 1) / 2 : 0;

  const isTwoNodeCycle = hasMultipleEdges;
  const endpointOffset = multiplier * 12 * directionMultiplier;
  const radius = 48; // Fixed circle radius (45px) + 3px gap to push marker out

  const adjSourceX = sourceCenterX + ux * radius + nx * endpointOffset;
  const adjSourceY = sourceCenterY + uy * radius + ny * endpointOffset;
  const adjTargetX = targetCenterX - ux * radius + nx * endpointOffset;
  const adjTargetY = targetCenterY - uy * radius + ny * endpointOffset;

  const onDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEdges((eds) => eds.filter((edge) => edge.id !== id));
    useGraphStore.getState().trackEdgeDeleted(id);
  };

  const mx = (adjSourceX + adjTargetX) / 2;
  const my = (adjSourceY + adjTargetY) / 2;

  const offset = multiplier * 35 * directionMultiplier;

  let edgePath = '';
  let labelX = mx;
  let labelY = my;

  if (isTwoNodeCycle) {
    const controlX = mx + nx * offset * 2;
    const controlY = my + ny * offset * 2;
    edgePath = `M ${adjSourceX},${adjSourceY} Q ${controlX},${controlY} ${adjTargetX},${adjTargetY}`;
    labelX = mx + nx * offset;
    labelY = my + ny * offset;
  } else {
    const [stdPath, stdLabelX, stdLabelY] =
      data?.pathType === 'step'
        ? getSmoothStepPath({
            sourceX: adjSourceX,
            sourceY: adjSourceY,
            sourcePosition,
            targetX: adjTargetX,
            targetY: adjTargetY,
            targetPosition,
            borderRadius: 0,
          })
        : getStraightPath({
            sourceX: adjSourceX,
            sourceY: adjSourceY,
            targetX: adjTargetX,
            targetY: adjTargetY,
          });
    edgePath = stdPath;
    labelX = stdLabelX;
    labelY = stdLabelY;
  }

  const positionXNodeCycle = labelX;
  const positionYNodeCycle = labelY;

  let angle = Math.atan2(dy, dx) * (180 / Math.PI);
  if (angle > 90 || angle < -90) {
    angle += 180;
  }

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerStart={markerStart}
        markerEnd={markerEnd}
        style={mergedStyle}
      />
      {selected && label !== 'INCLUDE' && (
        <>
          <EdgeLabelRenderer>
            <div
              style={{
                position: 'absolute',
                transform: `translate(-50%, -100%) translate(${labelX}px,${labelY - 10}px)`,
                background: 'white',
                padding: '4px',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                display: 'flex',
                gap: '4px',
                zIndex: 1000,
                pointerEvents: 'all',
                border: '1px solid #e2e8f0',
              }}
              className="nodrag nopan edge-toolbar-actions"
            >
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                }}
                sx={{
                  p: 0.5,
                  color: '#64748b',
                  '&:hover': { bgcolor: '#f1f5f9', color: '#4f46e5' },
                }}
              >
                <Wrench size={14} />
              </IconButton>
              <IconButton
                size="small"
                onClick={onDelete}
                sx={{
                  p: 0.5,
                  color: '#64748b',
                  '&:hover': {
                    bgcolor: alpha('#ef4444', 0.1),
                    color: '#ef4444',
                  },
                }}
              >
                <Trash2 size={14} />
              </IconButton>
            </div>
          </EdgeLabelRenderer>
        </>
      )}
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${positionXNodeCycle}px,${positionYNodeCycle}px) rotate(${angle}deg)`,
              background: '#f8fafc', // match canvas background to cleanly mask the line
              padding: '2px 6px',
              fontSize: '10px',
              fontWeight: 600,
              color: '#64748b',
              pointerEvents: 'none',
            }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

const BPMNEdge = React.memo(BPMNEdgeComponent);
BPMNEdge.displayName = 'BPMNEdge';

export const edgeTypes = {
  default: BPMNEdge,
  step: BPMNEdge,
};

export default BPMNEdge;
