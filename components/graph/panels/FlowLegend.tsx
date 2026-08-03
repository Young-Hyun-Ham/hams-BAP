import React from 'react';
import { Box } from '@mui/material';

import type { NodeTypeStyle } from '@/lib/types/graphStyle';

interface FlowLegendProps {
  nodeTypeStyles: Record<string, NodeTypeStyle>;
  mode?: 'main' | 'popup';
}

/**
 * Legend palette showing node type colors and labels.
 * Rendered at the bottom-right corner of the canvas.
 * Data-driven: automatically reflects changes from the style service.
 */
const FlowLegend = ({ nodeTypeStyles, mode }: FlowLegendProps) => {
  const entries = Object.entries(nodeTypeStyles);

  if (entries.length === 0) return null;

  return (
    <Box
      sx={{
        position: 'absolute',
        bottom: 20,
        right: 16,
        zIndex: 10,
        bgcolor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        border: '1px solid #e2e8f0',
        px: 1,
        py: 0.5,
        display: 'flex',
        flexDirection: 'column',
        gap: 0.5,
        minWidth: 80,
        alignItems: 'flex-start',
      }}
    >
      {entries.map(([key, style]) => (
        <Box
          key={key}
          sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.2 }}
        >
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              bgcolor: style.bg,
              border: style.border || '1.5px solid #e2e8f0',
              mr: 0.7,
            }}
          />
          <Box
            sx={{
              fontSize: '0.75rem',
              color: '#1e293b',
              fontWeight: 600,
              textTransform: 'capitalize',
            }}
          >
            {key}
          </Box>
        </Box>
      ))}

      {/* Linked Node entry — only shown in popup mode */}
      {mode === 'popup' && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            mb: 0.2,
            mt: 0.3,
          }}
        >
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              bgcolor: 'transparent',
              border: '2px solid #16a34a',
              boxShadow: '0 0 5px 2px rgba(22, 163, 74, 0.4)',
              mr: 0.7,
            }}
          />
          <Box
            sx={{
              fontSize: '0.75rem',
              color: '#1e293b',
              fontWeight: 600,
            }}
          >
            Selected Node
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default React.memo(FlowLegend);
