import React from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

import { ICellRendererParams } from 'ag-grid-community';
export interface CustomCellRendererParams extends ICellRendererParams {
  toggleNode?: (id: string) => void;
  checkHasChildren?: (id: string) => boolean;
}

interface DeleteButtonRendererParams extends CustomCellRendererParams {
  onDelete: (data: any) => void;
}

const DeleteButtonRenderer: React.FC<DeleteButtonRendererParams> = (params) => {
  const handleClick = () => {
    if (params.data && params.onDelete) {
      params.onDelete(params.data);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
      }}
    >
      <IconButton
        onClick={handleClick}
        size="small"
        aria-label="delete"
        color="default"
        sx={{ color: '#64748b', '&:hover': { color: '#ef4444' } }}
      >
        <DeleteOutlineIcon fontSize="small" />
      </IconButton>
    </Box>
  );
};

export default DeleteButtonRenderer;
