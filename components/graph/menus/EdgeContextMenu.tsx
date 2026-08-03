import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';

import type { EdgeStyleConfig } from '@/lib/types/graphStyle';

interface MenuPosition {
  top: number;
  left: number;
}

interface EdgeContextMenuProps {
  position: MenuPosition | null;
  edgeStyles: Record<string, EdgeStyleConfig>;
  validEdgeTypes: string[];
  onClose: () => void;
  onChangeType: (type: string) => void;
}

/**
 * Context menu for changing the type/style of a selected edge.
 * Displays all available edge styles with visual line previews.
 */
const EdgeContextMenu = ({
  position,
  edgeStyles,
  validEdgeTypes,
  onClose,
  onChangeType,
}: EdgeContextMenuProps) => {
  const { t } = useTranslation();

  return (
    <Menu
      open={Boolean(position)}
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={
        position !== null
          ? { top: position.top, left: position.left }
          : undefined
      }
      PaperProps={{
        sx: {
          width: 220,
          borderRadius: '12px',
          mt: 1,
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        },
      }}
    >
      <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #f1f5f9', mb: 0.5 }}>
        <Typography
          variant="subtitle2"
          sx={{ fontWeight: 800, color: '#1e293b', fontSize: '0.85rem' }}
        >
          {t('Change element')}
        </Typography>
      </Box>
      <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
        {validEdgeTypes.map((key) => {
          const config = edgeStyles[key];
          if (!config) return null;
          return (
            <MenuItem
              key={key}
              onClick={() => onChangeType(key)}
              sx={{ py: 1.2, px: 2 }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                {config.pathType === 'CORNER' ? (
                  <Box
                    sx={{
                      width: 24,
                      height: 14,
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <Box sx={{ width: 14, height: 2, bgcolor: config.color }} />
                    <Box
                      sx={{
                        width: 2,
                        height: 8,
                        bgcolor: config.color,
                        position: 'absolute',
                        right: 10,
                        top: 4,
                      }}
                    />
                    <Box
                      sx={{
                        width: 0,
                        height: 0,
                        borderLeft: '3px solid transparent',
                        borderRight: '3px solid transparent',
                        borderTop: `5px solid ${config.color}`,
                        position: 'absolute',
                        right: 8,
                        top: 10,
                      }}
                    />
                  </Box>
                ) : (
                  <Box
                    sx={{
                      width: 24,
                      height: config.strokeWidth,
                      bgcolor:
                        config.strokeType === 'DASHED' ? 'none' : config.color,
                      borderTop:
                        config.strokeType === 'DASHED' ? '2px dashed' : 'none',
                      borderTopColor: config.color,
                    }}
                  />
                )}
              </ListItemIcon>
              <ListItemText
                primary={key}
                slotProps={{
                  primary: {
                    variant: 'body2',
                    fontWeight: 600,
                    fontSize: '12px',
                    color: '#1a1d36',
                  },
                }}
              />
            </MenuItem>
          );
        })}
      </Box>
    </Menu>
  );
};

export default React.memo(EdgeContextMenu);
