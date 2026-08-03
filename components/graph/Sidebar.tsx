import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { X } from 'lucide-react';
import { Node, useEdges } from '@xyflow/react';

import LeftSidebar from './sidebar/LeftSidebar';
import NodeInfoTab from './sidebar/NodeInfoTab';
import SourceDocumentsTab from './sidebar/SourceDocumentsTab';
import EditNodeTab from './sidebar/EditNodeTab';
import { VisualizationDataRes } from '@/lib/types/graph';
import { TreeItem } from './data/treeData';
import { GraphEditorMode } from '@/lib/types/graph';

interface SidebarProps {
  type: 'left' | 'right';
  mode?: GraphEditorMode;
  selectedNode?: any;
  onClose?: () => void;
  activeTab?: 'info' | 'chunks' | 'edit' | null;
  onTabChange?: (tab: 'info' | 'chunks' | 'edit' | null) => void;
  visualizationData?: VisualizationDataRes | null;
  isTreeLoading?: boolean;
  treeData?: TreeItem[];
  setTreeData?: React.Dispatch<React.SetStateAction<TreeItem[]>>;
  onNodeModified?: (id: string, properties: Record<string, any>) => void;
  onNodeDeleted?: (id: string, connectedEdgeIds: string[]) => void;
}

export const Sidebar = React.memo(
  ({
    type,
    mode = 'main',
    selectedNode,
    onClose,
    activeTab = 'info',
    onTabChange,
    visualizationData,
    isTreeLoading,
    treeData,
    setTreeData,
    onNodeModified,
    onNodeDeleted,
  }: SidebarProps) => {
    const { t } = useTranslation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const allEdges = useEdges();

    const currentTab =
      mode === 'popup'
        ? 'chunks'
        : (activeTab as 'info' | 'chunks' | 'edit') || 'info';

    const availableTabs =
      mode === 'popup'
        ? (['chunks'] as const)
        : (['chunks', 'info', 'edit'] as const);

    // ─── Left sidebar: delegate entirely ───────────────────────

    if (type === 'left') {
      return (
        <LeftSidebar
          visualizationData={visualizationData}
          isTreeLoading={isTreeLoading}
          treeData={treeData}
          setTreeData={setTreeData}
        />
      );
    }

    // ─── Right sidebar: node detail panel ──────────────────────

    const nodeEdges = selectedNode
      ? allEdges.filter(
          (e) => e.source === selectedNode.id || e.target === selectedNode.id,
        )
      : [];

    const nodeProps = selectedNode
      ? (() => {
          const d = selectedNode.data || {};
          return {
            id: selectedNode.id,
            type: (d.type as string) || selectedNode.type || '',
            node_id: (d.node_id as string) || '',
            docu_fil_id: (d.docu_fil_id as string) || '',
            stg_id: (d.stg_id as string) || '',
            ten_id: (d.ten_id as string) || '',
            label: d.label as string,
            desc: (d.desc as string) || '',
            tags: [
              (d.type as string) || selectedNode.type,
              d.stg_id as string,
            ].filter(Boolean),
          };
        })()
      : null;

    const handleTabChange = (newTab: 'info' | 'chunks' | 'edit') => {
      onTabChange?.(newTab);
    };

    return (
      <Box
        sx={{
          height: '100%',
          bgcolor: 'white',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 1,
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography
            variant="overline"
            sx={{
              fontWeight: 700,
              pl: 2,
              color: 'text.secondary',
              letterSpacing: '0.05em',
            }}
          >
            {t('DETAIL')}
          </Typography>
          {isMobile && onClose && (
            <IconButton
              size="small"
              onClick={onClose}
              sx={{ color: 'text.secondary' }}
            >
              <X size={18} />
            </IconButton>
          )}
        </Box>

        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflowY: currentTab === 'chunks' ? 'hidden' : 'auto',
            px: 1,
            pb: 1,
            minWidth: 320,
            minHeight: 0,
          }}
        >
          {selectedNode ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                minHeight: 0,
                gap: currentTab === 'chunks' ? 0 : 1,
              }}
            >
              {/* Tab Navigation */}
              <Box
                className="panel-tabs"
                sx={{
                  display: 'flex',
                  borderBottom: '1px solid #e5e7eb',
                  mb: currentTab === 'chunks' ? 0 : 1,
                  position: 'sticky',
                  top: 0,
                  zIndex: 2,
                  bgcolor: 'white',
                }}
              >
                {availableTabs.map((tabKey) => (
                  <Box
                    key={tabKey}
                    className={`ptab${currentTab === tabKey && mode !== 'popup' ? ' active' : ''}`}
                    sx={{
                      px: 2,
                      py: 1,
                      cursor: 'pointer',
                      fontWeight: 600,
                      color:
                        currentTab === tabKey && mode !== 'popup'
                          ? '#6366f1'
                          : '#64748b',
                      borderBottom:
                        currentTab === tabKey && mode !== 'popup'
                          ? '2px solid #6366f1'
                          : '2px solid transparent',
                      fontSize: '0.75rem',
                      transition: 'color 0.2s',
                      ...(tabKey !== 'chunks' && {
                        flex: 1,
                        textAlign: 'center',
                      }),
                    }}
                    onClick={() => handleTabChange(tabKey)}
                  >
                    {tabKey === 'info'
                      ? t('Node Info')
                      : tabKey === 'chunks'
                        ? t('Source Documents')
                        : t('Edit')}
                  </Box>
                ))}
              </Box>

              {/* Tab Content */}
              <Box
                sx={{
                  flex: 1,
                  minHeight: 0,
                  display: currentTab === 'chunks' ? 'flex' : 'block',
                  flexDirection: 'column',
                  overflowY: currentTab === 'chunks' ? 'hidden' : 'auto',
                }}
              >
                {currentTab === 'chunks' && (
                  <SourceDocumentsTab selectedNode={selectedNode} />
                )}
                {mode !== 'popup' && currentTab === 'info' && nodeProps && (
                  <NodeInfoTab nodeProps={nodeProps} nodeEdges={nodeEdges} />
                )}
                {mode !== 'popup' && currentTab === 'edit' && (
                  <EditNodeTab
                    key={selectedNode.id}
                    mode={mode}
                    selectedNode={selectedNode}
                    onClose={onClose}
                    onTabChange={onTabChange}
                    onNodeModified={onNodeModified}
                    onNodeDeleted={onNodeDeleted}
                  />
                )}
              </Box>
            </Box>
          ) : (
            <Box
              sx={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'text.secondary',
                textAlign: 'center',
                p: 4,
              }}
            >
              <Typography variant="body2">
                {t(
                  'Select a node to view its details and source documentation.',
                )}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    );
  },
);

Sidebar.displayName = 'Sidebar';
