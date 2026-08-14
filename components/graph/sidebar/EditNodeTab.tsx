import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box, TextField, Button, Stack } from '@mui/material';
import { Node, useReactFlow } from '@xyflow/react';

import { useGraphStyles, getNodePrefix } from '../useGraphStyles';
import { useModal } from '@/providers/ModalProvider';
import { DeleteIcon } from '@/app/(siderbar-header)/admin/builder/components/icons/Icons';
import { GraphEditorMode } from '@/lib/types/graph';

interface EditNodeTabProps {
  selectedNode: Node;
  mode?: GraphEditorMode;
  onClose?: () => void;
  onTabChange?: (tab: 'info' | 'chunks' | 'edit' | null) => void;
  onNodeModified?: (id: string, properties: Record<string, any>) => void;
  onNodeDeleted?: (id: string, connectedEdgeIds: string[]) => void;
}

/**
 * "Edit" tab: form to edit node properties, save changes, and delete nodes.
 * Uses useGraphStyles hook to get dynamic node styles (replaces old NODE_TYPE_STYLE import).
 */
const EditNodeTab = ({
  selectedNode,
  mode = 'main',
  onClose,
  onTabChange,
  onNodeModified,
  onNodeDeleted,
}: EditNodeTabProps) => {
  const { t } = useTranslation();
  const { showConfirm } = useModal();
  const { setNodes, setEdges, getEdges } = useReactFlow();
  const { nodeTypes, nodeTypeStyles } = useGraphStyles();

  // ─── Local form state ───────────────────────────────────────

  const [editLabel, setEditLabel] = React.useState<string>(
    (selectedNode?.data?.label as string) || '',
  );
  const [editNodeType, setEditNodeType] = React.useState<string>(
    (selectedNode?.data?.type as string) || 'L3',
  );
  const [editDesc, setEditDesc] = React.useState<string>(
    (selectedNode?.data?.desc as string) || '',
  );

  // ─── Actions ────────────────────────────────────────────────

  const handleSave = () => {
    const hasLabelChanged =
      editLabel !== ((selectedNode?.data?.label as string) || '');
    const hasTypeChanged =
      editNodeType !== ((selectedNode?.data?.type as string) || 'L3');
    const hasDescChanged =
      editDesc !== ((selectedNode?.data?.desc as string) || '');

    if (!hasLabelChanged && !hasTypeChanged && !hasDescChanged) {
      // onTabChange?.('info');
      return;
    }

    const prefix = getNodePrefix(editNodeType);
    const style = nodeTypeStyles[prefix] || nodeTypeStyles['Default'] || {};
    setNodes((nds) =>
      nds.map((n) =>
        n.id === selectedNode.id
          ? {
              ...n,
              type: prefix || 'Default',
              data: {
                ...n.data,
                label: editLabel,
                type: editNodeType,
                desc: editDesc,
                nodeBgColor: style.bg,
                nodeBorder: style.border,
                nodeColor: style.color,
              },
            }
          : n,
      ),
    );

    // Track modification locally
    onNodeModified?.(selectedNode.id, {
      name: editLabel,
      label: editLabel,
      type: editNodeType,
      desc: editDesc,
    });
  };

  const removeNode = async (id: string) => {
    if (
      await showConfirm(t('Do you want to delete this node?'))
    ) {
      const connectedEdges = getEdges().filter(
        (e) => e.source === id || e.target === id,
      );
      const connectedEdgeIds = connectedEdges.map((e) => e.id);

      setNodes((nds) => nds.filter((n) => n.id !== id));
      setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));

      onNodeDeleted?.(id, connectedEdgeIds);
      if (onClose) onClose();
    }
  };

  // ─── Shared field styles ────────────────────────────────────

  const fieldSx = {
    '& .MuiOutlinedInput-root': {
      bgcolor: '#f8fafc',
      borderRadius: '8px',
      fontSize: '0.95rem',
      '& fieldset': { borderColor: '#e2e8f0' },
      '&:hover fieldset': { borderColor: '#cbd5e1' },
    },
  };

  // ─── Render ─────────────────────────────────────────────────

  return (
    <Box
      component="form"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        p: 1,
        '& *': { fontSize: 'inherit' },
        '& .MuiInputBase-input::placeholder': { fontSize: '12px' },
        '& .MuiInputLabel-root': { fontSize: '12px' },
        '& .MuiInputLabel-shrink': {
          transform: 'translate(12px, -9px) scale(1)',
        },
      }}
    >
      <TextField
        label="Node Name"
        value={editLabel}
        onChange={(e) => setEditLabel(e.target.value)}
        fullWidth
        size="small"
        variant="outlined"
        sx={fieldSx}
      />
      <TextField
        select
        disabled
        label="Node Type"
        value={editNodeType}
        onChange={(e) => setEditNodeType(e.target.value)}
        fullWidth
        size="small"
        variant="outlined"
        SelectProps={{
          native: true,
          displayEmpty: true,
          renderValue: (selected) => {
            if (!selected) {
              return (
                <span style={{ color: '#aaa' }}>{t('Select an option')}</span>
              );
            }
            return selected as string;
          },
        }}
        sx={fieldSx}
        InputLabelProps={{ shrink: true }}
      >
        {Object.entries(nodeTypes).map(([key, value]) => (
          <option key={key} value={key}>
            {value}
          </option>
        ))}
      </TextField>
      <TextField
        label="Description"
        value={editDesc}
        onChange={(e) => setEditDesc(e.target.value)}
        fullWidth
        size="small"
        variant="outlined"
        multiline
        minRows={3}
        sx={fieldSx}
      />
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {mode === 'main' && (
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              disableElevation
              sx={{ textTransform: 'none' }}
              onClick={handleSave}
            >
              {t('Save Node')}
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              sx={{ textTransform: 'none', width: 30 }}
              onClick={() => onTabChange?.('info')}
            >
              {t('Cancel')}
            </Button>
          </Stack>
        )}
        <Box />
      </Box>
    </Box>
  );
};

export default EditNodeTab;
