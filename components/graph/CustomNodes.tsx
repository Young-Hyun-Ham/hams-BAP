import React, { memo } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { Box, Typography, alpha } from '@mui/material';
import type { NodeLevel } from '@/lib/types/graph';

export type BusinessNodeData = {
  label: string;
  code?: string;
  type: NodeLevel | string;
  desc?: string;
  statusColor?: string;
  nodeBgColor?: string;
  nodeBorder?: string;
  nodeColor?: string;
  /** Marks this node as picked by user (Ctrl+Click multi-select in popup mode). */
  isPickedNode?: boolean;
};

export type BusinessNode = Node<BusinessNodeData>;

const PICK_COLOR = '#16a34a'; // green-600

const pickedKeyframes = `
  @keyframes nodePickedPulse {
    0%   { box-shadow: 0 0 0 2px ${PICK_COLOR}40; }
    50%  { box-shadow: 0 0 0 5px ${PICK_COLOR}25; }
    100% { box-shadow: 0 0 0 2px ${PICK_COLOR}40; }
  }
`;

const BusinessNodeComponent = ({ data, selected }: NodeProps<BusinessNode>) => {
  const statusColor = data.statusColor || '#3b82f6';
  const isPicked = !!data.isPickedNode;
  return (
    <>
      {isPicked && <style>{pickedKeyframes}</style>}
      {/* Green checkmark badge shown when node is picked via Ctrl+Click */}
      {isPicked && (
        <Box
          sx={{
            position: 'absolute',
            top: -6,
            right: -6,
            width: 20,
            height: 20,
            borderRadius: '50%',
            bgcolor: '#16a34a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid white',
            boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
            zIndex: 20,
            pointerEvents: 'none',
          }}
        >
          <Typography
            sx={{
              fontSize: '11px',
              color: 'white',
              lineHeight: 1,
              fontWeight: 700,
            }}
          >
            ✓
          </Typography>
        </Box>
      )}
      <Box
        sx={{
          width: 90,
          height: 90,
          borderRadius: '50%',
          bgcolor: data.nodeBgColor,
          border: isPicked
            ? `3px solid ${PICK_COLOR}`
            : data.nodeBorder || '2px solid',
          borderColor: isPicked ? PICK_COLOR : alpha(statusColor, 0.1),
          boxShadow: isPicked
            ? undefined
            : selected
              ? '0 0 0 3px rgba(148,163,184,0.2), 0 4px 12px rgba(0,0,0,0.06)'
              : '0 4px 12px rgba(0,0,0,0.05)',
          '--sel-glow': alpha(statusColor, 0.35),
          animation: isPicked
            ? 'nodePickedPulse 1.8s ease-in-out infinite'
            : 'none',
          transform: 'scale(1)',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 1,
          transition:
            'border-color 0.2s cubic-bezier(0.4, 0, 0.2, 1), transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            borderColor: statusColor,
            transform: 'translateY(-2px)',
            boxShadow: `0 6px 16px ${alpha(statusColor, 0.15)}`,
          },
          // Hover-to-show handles (hidden in popup mode via FlowCanvas container style)
          '& .react-flow__handle': {
            opacity: 0,
            transition: 'opacity 0.2s ease, transform 0.2s ease',
          },
          '&:hover .react-flow__handle': {
            opacity: 1,
          },
        }}
      >
        <Handle
          type="target"
          position={Position.Left}
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 16,
            height: 16,
            background: 'rgba(255, 255, 255, 0.8)',
            border: `2px solid ${statusColor}`,
            zIndex: 10,
          }}
        />

        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            color: data.nodeColor || '#1e293b',
            textAlign: 'center',
            fontSize: '0.75rem',
            lineHeight: 1.2,
            display: '-webkit-box',
            WebkitLineClamp: 4,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            pointerEvents: 'none',
            zIndex: 1,
            transition: 'color 0.2s ease',
          }}
        >
          {data.label}
        </Typography>

        <Handle
          type="source"
          position={Position.Right}
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 16,
            height: 16,
            background: 'rgba(255, 255, 255, 0.8)',
            border: `2px solid ${statusColor}`,
            zIndex: 10,
          }}
        />
      </Box>
    </>
  );
};

export default memo(BusinessNodeComponent);
