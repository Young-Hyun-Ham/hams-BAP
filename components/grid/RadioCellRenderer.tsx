import React, { useEffect, useState } from 'react';
import { Box, Radio } from '@mui/material';
import { CustomCellRendererProps } from 'ag-grid-react';

export interface RadioCellRendererParams extends CustomCellRendererProps {
  requestSelection?: (node: any) => void;
}

export default function RadioCellRenderer(params: RadioCellRendererParams) {
  const [selected, setSelected] = useState(false);

  useEffect(() => {
    // Initial state
    setSelected(params.node.isSelected() ?? false);

    // Listen for selection changes on this node
    const onSelectionChanged = () => {
      setSelected(params.node.isSelected() ?? false);
    };

    params.node.addEventListener('rowSelected', onSelectionChanged);

    // Cleanup
    return () => {
      params.node.removeEventListener('rowSelected', onSelectionChanged);
    };
  }, [params.node]);

  const handleChange = () => {
    if (params.requestSelection) {
      params.requestSelection(params.node);
    } else {
      params.node.setSelected(true);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
      }}
    >
      <Radio
        checked={selected}
        onChange={handleChange}
        size="small"
        disableRipple
        sx={{ padding: 0 }}
      />
    </Box>
  );
}
