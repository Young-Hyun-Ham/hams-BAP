import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  alpha,
  Box,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { Pencil, Plus, LinkIcon, Trash2 } from 'lucide-react';

interface MenuPosition {
  top: number;
  left: number;
}

interface NodeContextMenuProps {
  position: MenuPosition | null;
  onClose: () => void;
  onEdit: () => void;
  onAddChild: () => void;
  onConnect: () => void;
  onDelete: () => void;
}

/**
 * Context menu displayed when right-clicking on a node.
 * Provides edit, add child, connect, and delete actions.
 */
const NodeContextMenu = ({
  position,
  onClose,
  onEdit,
  onAddChild,
  onConnect,
  onDelete,
}: NodeContextMenuProps) => {
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
          width: 180,
          borderRadius: '12px',
          mt: 1,
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
          border: '1px solid #dde1f0',
          py: 0.5,
        },
      }}
    >
      <MenuItem
        onClick={onEdit}
        sx={{ py: 1.2, '&:hover': { bgcolor: '#f4f5fb' } }}
      >
        <ListItemIcon sx={{ minWidth: '32px !important' }}>
          <Pencil size={16} color="#ef6c00" />
        </ListItemIcon>
        <ListItemText
          primary={t('Edit Node')}
          primaryTypographyProps={{
            variant: 'body2',
            fontWeight: 600,
            color: '#1a1d36',
          }}
        />
      </MenuItem>

      {/* <MenuItem
        onClick={onAddChild}
        sx={{ py: 1.2, '&:hover': { bgcolor: '#f4f5fb' } }}
      >
        <ListItemIcon sx={{ minWidth: '32px !important' }}>
          <Plus size={18} color="#43a047" />
        </ListItemIcon>
        <ListItemText
          primary={t('Add Child Node')}
          primaryTypographyProps={{
            variant: 'body2',
            fontWeight: 600,
            color: '#1a1d36',
          }}
        />
      </MenuItem>

      <MenuItem
        onClick={onConnect}
        sx={{ py: 1.2, '&:hover': { bgcolor: '#f4f5fb' } }}
      >
        <ListItemIcon sx={{ minWidth: '32px !important' }}>
          <LinkIcon size={16} color="#6c63ff" />
        </ListItemIcon>
        <ListItemText
          primary={t('Connect Edge')}
          primaryTypographyProps={{
            variant: 'body2',
            fontWeight: 600,
            color: '#1a1d36',
          }}
        />
      </MenuItem> */}

      {/* <Box sx={{ height: '1px', bgcolor: '#dde1f0', my: 0.5 }} />

      <MenuItem
        onClick={onDelete}
        sx={{ py: 1.2, '&:hover': { bgcolor: alpha('#ef5350', 0.08) } }}
      >
        <ListItemIcon sx={{ minWidth: '32px !important' }}>
          <Trash2 size={16} color="#ef5350" />
        </ListItemIcon>
        <ListItemText
          primary={t('Delete Node')}
          primaryTypographyProps={{
            variant: 'body2',
            fontWeight: 600,
            color: '#ef5350',
          }}
        />
      </MenuItem> */}
    </Menu>
  );
};

export default React.memo(NodeContextMenu);
