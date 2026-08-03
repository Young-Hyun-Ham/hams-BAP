import React, { memo, useLayoutEffect } from 'react';
import { Handle, Position, NodeProps, useUpdateNodeInternals } from 'reactflow';
import { Box, Typography } from '@mui/material';

function formatDuration(ms) {
  if (!ms || ms <= 0) return '0s';
  if (ms < 1000) return `${ms}ms`;
  const sec = ms / 1000;
  return Number.isInteger(sec) ? `${sec}s` : `${sec.toFixed(1)}s`;
}

const DelayNode = ({ id, data, selected }) => {
  const updateNodeInternals = useUpdateNodeInternals();

  const inputPos = data?.inputPosition === 'top' ? Position.Top : Position.Left;
  const outputPos =
    data?.outputPosition === 'bottom' ||
    data?.outputPositions?.['default'] === 'bottom'
      ? Position.Bottom
      : Position.Right;

  useLayoutEffect(() => {
    updateNodeInternals(id);
  }, [id, inputPos, outputPos, updateNodeInternals]);

  const displayTime = formatDuration(data?.duration);

  return (
    <Box
      sx={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        bgcolor: '#ffffff',
        border: selected ? '2px solid #f59e0b' : '2px solid #d97706',
        boxShadow: selected
          ? '0 0 0 3px rgba(245, 158, 11, 0.25), 0 4px 10px rgba(0,0,0,0.15)'
          : '0 2px 6px rgba(0,0,0,0.12)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        '&:hover': {
          transform: 'scale(1.1)',
          borderColor: '#f59e0b',
        },
      }}
    >
      {/* Target handle */}
      <Handle
        type="target"
        position={inputPos}
        id={inputPos === Position.Top ? 'input-top' : 'input'}
        style={{
          width: 8,
          height: 8,
          background: '#d97706',
          border: '1.5px solid #ffffff',
          zIndex: 10,
          ...(inputPos === Position.Top ? { top: -4 } : { left: -4 }),
        }}
      />

      {/* Time Label inside node */}
      <Typography
        variant="caption"
        sx={{
          fontSize: '10px',
          fontWeight: 800,
          color: '#92400e',
          userSelect: 'none',
          letterSpacing: '-0.3px',
          lineHeight: 1,
        }}
      >
        {displayTime}
      </Typography>

      {/* Source handle */}
      <Handle
        type="source"
        position={outputPos}
        id={outputPos === Position.Bottom ? 'output-bottom' : 'default'}
        style={{
          width: 8,
          height: 8,
          background: '#d97706',
          border: '1.5px solid #ffffff',
          zIndex: 10,
          ...(outputPos === Position.Bottom ? { bottom: -4 } : { right: -4 }),
        }}
      />
    </Box>
  );
};

export default memo(DelayNode);
