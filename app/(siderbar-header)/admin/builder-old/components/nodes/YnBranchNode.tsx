import React, { memo, useLayoutEffect } from 'react';
import { Handle, Position, NodeProps, useUpdateNodeInternals } from 'reactflow';
import { Box, Typography } from '@mui/material';

export interface YnBranchNodeData {
  id?: string;
  label?: string;
  isSimpleYN?: boolean;
  replies?: Array<{ display?: string; value?: string }>;
  [key: string]: any;
}

const YnBranchNode = ({ id, data, selected }: NodeProps<YnBranchNodeData>) => {
  const replyYId = data?.replies?.[0]?.value || 'Y';
  const replyNId = data?.replies?.[1]?.value || 'N';
  const updateNodeInternals = useUpdateNodeInternals();

  const inputPos = data?.inputPosition === 'top' ? Position.Top : Position.Left;

  useLayoutEffect(() => {
    updateNodeInternals(id);
  }, [id, inputPos, updateNodeInternals]);

  return (
    <Box
      sx={{
        width: 30,
        height: 30,
        borderRadius: '50%',
        bgcolor: '#ffffff',
        border: selected ? '2px solid #2563eb' : '2px solid #475569',
        boxShadow: selected
          ? '0 0 0 3px rgba(37, 99, 235, 0.25), 0 4px 10px rgba(0,0,0,0.15)'
          : '0 2px 6px rgba(0,0,0,0.12)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        '&:hover': {
          transform: 'scale(1.1)',
          borderColor: '#2563eb',
        },
      }}
    >
      {/* Input handle (Left or Top) */}
      <Handle
        type="target"
        position={inputPos}
        id={inputPos === Position.Top ? 'input-top' : 'input'}
        style={{
          width: 8,
          height: 8,
          background: '#64748b',
          border: '1.5px solid #ffffff',
          zIndex: 10,
          ...(inputPos === Position.Top ? { top: -4 } : { left: -4 }),
        }}
      />

      {/* Label inside node */}
      <Typography
        variant="caption"
        sx={{
          fontSize: '9px',
          fontWeight: 800,
          color: '#1e293b',
          userSelect: 'none',
          letterSpacing: '-0.5px',
        }}
      >
        Y/N
      </Typography>

      {/* Output Y handle */}
      {(() => {
        const posY = data?.outputPositions?.['Y'] || 'right';
        const isBottomY = posY === 'bottom';

        return (
          <>
            <Handle
              type="source"
              position={isBottomY ? Position.Bottom : Position.Right}
              id={replyYId}
              style={{
                width: 8,
                height: 8,
                background: '#16a34a',
                ...(isBottomY
                  ? { bottom: -4, left: '35%' }
                  : { right: -4, top: '50%' }),
                border: '1.5px solid #ffffff',
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                ...(isBottomY
                  ? {
                      bottom: -15,
                      left: '35%',
                      transform: 'translateX(-50%)',
                    }
                  : { right: -15, top: '50%', transform: 'translateY(-50%)' }),
                bgcolor: '#16a34a',
                color: '#ffffff',
                fontSize: '9px',
                fontWeight: 800,
                px: '3px',
                py: '1px',
                borderRadius: '3px',
                lineHeight: 1,
                pointerEvents: 'none',
                userSelect: 'none',
              }}
            >
              Y
            </Box>
          </>
        );
      })()}

      {/* Output N handle */}
      {(() => {
        const posN = data?.outputPositions?.['N'] || 'bottom';
        const isRightN = posN === 'right';

        return (
          <>
            <Handle
              type="source"
              position={isRightN ? Position.Right : Position.Bottom}
              id={replyNId}
              style={{
                width: 8,
                height: 8,
                background: '#dc2626',
                ...(isRightN
                  ? { right: -4, top: '75%' }
                  : { bottom: -4, left: '65%' }),
                border: '1.5px solid #ffffff',
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                ...(isRightN
                  ? { right: -15, top: '75%', transform: 'translateY(-50%)' }
                  : {
                      bottom: -15,
                      left: '65%',
                      transform: 'translateX(-50%)',
                    }),
                bgcolor: '#dc2626',
                color: '#ffffff',
                fontSize: '9px',
                fontWeight: 800,
                px: '3px',
                py: '1px',
                borderRadius: '3px',
                lineHeight: 1,
                pointerEvents: 'none',
                userSelect: 'none',
              }}
            >
              N
            </Box>
          </>
        );
      })()}
    </Box>
  );
};

export default memo(YnBranchNode);
