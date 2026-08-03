import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography, Chip, alpha } from '@mui/material';
import { Edge } from '@xyflow/react';

import { useGraphStyles, getNodePrefix } from '../useGraphStyles';

interface NodeProps {
  id: string;
  type: string;
  node_id: string;
  docu_fil_id: string;
  stg_id: string;
  ten_id: string;
  label: string;
  desc: string;
  tags: string[];
}

const DetailRow = ({ label, value, highlight, color }: any) => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      py: 0.75,
      borderBottom: highlight ? 'none' : '1px solid #f1f5f9',
    }}
  >
    <Typography
      variant="body2"
      color="text.secondary"
      sx={{ fontSize: '0.85rem' }}
    >
      {label}
    </Typography>
    {highlight ? (
      <Chip
        label={value}
        size="small"
        sx={{
          bgcolor: alpha(color || '#6366f1', 0.1),
          color: color || '#6366f1',
          fontWeight: 700,
          borderRadius: '4px',
          fontSize: '0.7rem',
        }}
      />
    ) : (
      <Typography
        variant="body2"
        sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.85rem' }}
      >
        {value}
      </Typography>
    )}
  </Box>
);

interface NodeInfoTabProps {
  nodeProps: NodeProps;
  nodeEdges: Edge[];
}

/**
 * "Node Info" tab: displays node properties, relationships, tags, and description.
 */
const NodeInfoTab = ({ nodeProps, nodeEdges }: NodeInfoTabProps) => {
  const { t } = useTranslation();
  const { nodeTypes } = useGraphStyles();

  // Dynamically resolve type label
  const resolvedTypeLabel = useMemo(() => {
    // 1. Try exact match (e.g. L1_Stream)
    if (nodeTypes[nodeProps.type]) {
      return nodeTypes[nodeProps.type];
    }
    // 2. Try prefix match (e.g. L1 -> Stream)
    const prefix = getNodePrefix(nodeProps.type);
    const matchedEntry = Object.entries(nodeTypes).find(
      ([key]) => getNodePrefix(key) === prefix,
    );
    if (matchedEntry) {
      return matchedEntry[1];
    }
    // 3. Fallback to raw type
    return nodeProps.type;
  }, [nodeTypes, nodeProps.type]);

  const formatEdgeLabels = (edges: Edge[]) => {
    if (!edges || edges.length === 0) return t('None');

    const counts = edges.reduce(
      (acc, e) => {
        const label = (e.label as string) || 'Unknown';
        acc[label] = (acc[label] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return Object.entries(counts)
      .map(([label, count]) => `${label}(${count})`)
      .join(', ');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Node Properties */}
      <Box sx={{ bgcolor: '#f8fafc', borderRadius: 2, p: 2, mb: 0 }}>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 700,
            color: '#6366f1',
            letterSpacing: '0.05em',
          }}
        >
          {t('Node Info')}
        </Typography>
        <Box sx={{ mt: 1, '& *': { fontSize: '12px !important' } }}>
          <DetailRow label={t('Document ID')} value={nodeProps.docu_fil_id} />
          <DetailRow label={t('Node ID')} value={nodeProps.node_id} />
          {/* <DetailRow label={t('Node ID')} value={nodeProps.id} /> */}
          <DetailRow label={t('Node Name')} value={nodeProps.label} />
          <DetailRow label={t('Type')} value={resolvedTypeLabel} />
          <DetailRow label={t('Tenant')} value={nodeProps.ten_id} />
          <DetailRow label={t('Stage')} value={nodeProps.stg_id} />
        </Box>
      </Box>
      {/* Relationships */}
      <Box>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 700,
            color: '#64748b',
            letterSpacing: '0.05em',
          }}
        >
          {t('Relationships')}
        </Typography>
        <Box
          sx={{
            mt: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            '& *': { fontSize: '12px' },
          }}
        >
          <DetailRow
            label={t('Edges In')}
            value={formatEdgeLabels(
              nodeEdges.filter((e) => e.target === nodeProps.id),
            )}
          />
          <DetailRow
            label={t('Edges Out')}
            value={formatEdgeLabels(
              nodeEdges.filter((e) => e.source === nodeProps.id),
            )}
          />
        </Box>
      </Box>
      {/* Tags */}
      <Box>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 700,
            color: '#64748b',
            letterSpacing: '0.05em',
          }}
        >
          {t('Tags')}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
          {nodeProps.tags.map((tag, i) => (
            <Chip
              key={i}
              label={tag}
              size="small"
              sx={{
                fontSize: '0.7rem',
                bgcolor: alpha('#6366f1', 0.1),
                color: '#6366f1',
                fontWeight: 600,
                borderRadius: '4px',
              }}
            />
          ))}
        </Box>
      </Box>
      {/* Description */}
      <Box>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 700,
            color: '#64748b',
            letterSpacing: '0.05em',
          }}
        >
          {t('Description')}
        </Typography>
        <Typography
          variant="body2"
          sx={{ fontSize: '12px', color: '#64748b', mt: 0.5 }}
        >
          {nodeProps.desc || '-'}
        </Typography>
      </Box>
    </Box>
  );
};

export default NodeInfoTab;
