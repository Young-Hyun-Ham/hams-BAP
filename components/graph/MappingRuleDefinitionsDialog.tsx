import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  IconButton,
  Typography,
} from '@mui/material';
import { Settings, X } from 'lucide-react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, ICellRendererParams } from 'ag-grid-community';
import {
  defaultGridOptions,
  defaultGridTheme,
} from '@/lib/grid/defaultGridOptions';
import SectionArea from '@/components/common/SectionArea';
import FooterArea from '@/components/common/FooterArea';

interface MappingRuleDefinitionsDialogProps {
  open: boolean;
  onClose: () => void;
}

import { useGraphStore } from './store/useGraphStore';
import type { MappingRule } from '@/lib/types/graphStyle';

/** Custom cell renderer for the Edge type column – shows a coloured monospace badge */
const EdgeTypeCellRenderer = (params: ICellRendererParams<MappingRule>) => {
  const color = params.data?.color || params.data?.edgeColor || '#111111';
  return (
    <span
      style={{
        color,
        fontFamily: 'monospace',
        fontWeight: 600,
        fontSize: '0.85rem',
      }}
    >
      {params.value ? `[:${params.value}]` : ''}
    </span>
  );
};

/** Custom cell renderer for the Line Design column – draws a coloured SVG path with dynamic markers */
const LineDesignCellRenderer = (params: ICellRendererParams<MappingRule>) => {
  const rule = params.data;
  if (!rule) return null;

  const color = rule.color || rule.edgeColor || '#111111';
  const isDashed = rule.strokeType === 'DASHED';
  const sourceMark = rule.sourceMark || 'NONE';
  const targetMark = rule.targetMark || 'NONE';

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        height: '100%',
        width: '100%',
      }}
    >
      <svg width="80" height="20" style={{ overflow: 'visible' }}>
        <defs>
          <marker
            id={`dg-arrow-${color}`}
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
          </marker>
          <marker
            id={`dg-circle-${color}`}
            viewBox="0 0 10 10"
            refX="5"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto"
          >
            <circle cx="5" cy="5" r="4" fill={color} />
          </marker>
          <marker
            id={`dg-square-${color}`}
            viewBox="0 0 10 10"
            refX="5"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto"
          >
            <rect x="1" y="1" width="8" height="8" fill={color} />
          </marker>
          <marker
            id={`dg-rhombus-${color}`}
            viewBox="0 0 10 10"
            refX="5"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto"
          >
            <path d="M 5 0 L 10 5 L 5 10 L 0 5 Z" fill={color} />
          </marker>
        </defs>

        <path
          d="M 10 10 L 70 10"
          stroke={color}
          strokeWidth="2"
          strokeDasharray={isDashed ? '4, 3' : undefined}
          markerStart={
            sourceMark !== 'NONE'
              ? `url(#dg-${sourceMark.toLowerCase()}-${color})`
              : undefined
          }
          markerEnd={
            targetMark !== 'NONE'
              ? `url(#dg-${targetMark.toLowerCase()}-${color})`
              : undefined
          }
        />
      </svg>
    </Box>
  );
};

const MappingRuleDefinitionsDialog: React.FC<
  MappingRuleDefinitionsDialogProps
> = ({ open, onClose }) => {
  const { t } = useTranslation();
  const mappingRules = useGraphStore((state) => state.mappingRules);

  const columnDefs = useMemo<ColDef<MappingRule>[]>(
    () => [
      {
        field: 'startingPointType',
        headerName: t('Starting point type'),
        minWidth: 150,
        flex: 1,
        cellStyle: { fontWeight: 600, color: '#0f172a' },
      },
      {
        field: 'destinationType',
        headerName: t('Destination type'),
        minWidth: 120,
        flex: 1,
      },
      {
        colId: 'label',
        valueGetter: (params) => params.data?.label || params.data?.edgeType,
        headerName: t('Edge type'),
        minWidth: 120,
        flex: 1,
        cellRenderer: EdgeTypeCellRenderer,
      },
      {
        headerName: t('Line Design'),
        minWidth: 120,
        flex: 1,
        sortable: false,
        cellRenderer: LineDesignCellRenderer,
      },
    ],
    [t],
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      PaperProps={{
        sx: {
          bgcolor: '#ffffff',
          color: '#0f172a',
          borderRadius: '20px',
          p: 3.5,
          maxWidth: '850px',
          width: '100%',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
          border: '1px solid #e2e8f0',
        },
      }}
    >
      <DialogContent sx={{ p: 0, position: 'relative', overflow: 'hidden' }}>
        {/* Close icon */}
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: -8,
            top: -8,
            color: '#64748b',
            '&:hover': { color: '#0f172a', bgcolor: '#f1f5f9' },
          }}
        >
          <X size={20} />
        </IconButton>

        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <Settings size={22} style={{ color: '#2563eb' }} />
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, fontSize: '1.15rem', color: '#0f172a' }}
          >
            {t('Common Mapping Rule')}
          </Typography>
        </Box>

        {/* Description */}
        <Typography
          sx={{
            color: '#475569',
            fontSize: '0.875rem',
            mb: 3,
            lineHeight: 1.6,
          }}
        >
          {t('This standard definition is automatically injected as a ')}
          <strong style={{ color: '#0f172a', fontWeight: 700 }}>
            {t('parsing prompt rule for LLM inference')}
          </strong>
          {t(
            ' when building the secondary structure of the Business Knowledge Graph in all modules of the enterprise, and acts as a backend cypher generation condition during user drag-and-drop mapping.',
          )}
        </Typography>

        {/* ag-Grid table */}
        {/* <Box
          sx={{
            width: '100%',
            mb: 3,
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            overflowY: 'hidden',
          }}
        >
          <AgGridReact<MappingRuleRow>
            rowData={MAPPING_RULES}
            columnDefs={columnDefs}
            defaultColDef={{
              ...defaultGridOptions.defaultColDef,
              editable: false,
              sortable: false,
              filter: false,
              resizable: false,
            }}
            domLayout="autoHeight"
            headerHeight={36}
            rowHeight={42}
            suppressCellFocus
            suppressHorizontalScroll
          />
        </Box> */}
        <SectionArea
          sx={{
            gap: 1.5,
            p: 1,

            '& .ag-header': {
              borderTop: '1px solid #e0e0e0',
              backgroundColor: 'white',
            },
            '& .ag-root-wrapper': {
              border: 'none',
              borderRadius: 0,
            },
          }}
        >
          <Box
            className="ag-theme-quartz"
            height="100%"
            display="flex"
            flexDirection="column"
            borderRadius={1}
          >
            <Box
              px={1.5}
              py={1}
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              <Typography variant="subtitle1" component="h1" fontWeight="bold">
                {t('Mapping Rule Definitions')}
                <Box component="span">({mappingRules.length})</Box>
              </Typography>
            </Box>

            <Box flex={1}>
              <AgGridReact<MappingRule>
                {...defaultGridOptions}
                columnDefs={columnDefs}
                stopEditingWhenCellsLoseFocus={true}
                rowData={mappingRules}
                pagination={false}
                domLayout="autoHeight"
              />
            </Box>
          </Box>
        </SectionArea>
      </DialogContent>
    </Dialog>
  );
};

export default React.memo(MappingRuleDefinitionsDialog);
